### 들어가며

개발 당시에 있었던 과제 크롤링 관련 트러블 슈팅에 대한 내용입니다.

다시 돌아보면 코드 한 줄짜리 실수지만, 겨우 한 줄로 프로젝트 전체에 큰 결함이 생긴 일이었기에 기록을 남깁니다.

### 담당한 기능

저는 플라토 캘린더에 표시할 과제를 크롤링하는 기능을 맡았습니다.

과제 유형에 따라 페이지를 불러와서 과제명, 제출 링크, 마감 기한, 제출 여부를 확인해서 과제 리스트를 만들어 넘겨주는 작업이었습니다.

이미 잘 작동했던 레거시 코드가 존재하는 상황이었고, jQuery로 작성되어있었지만 학교 수업에서 배운 내용만으로 읽어낼 수 있었습니다.

### 뜬금없이 나타난 버그

과제 유형은 총 4가지로 파일 제출, 퀴즈, 녹강, 실강이었고 문제가 발생한 과제는 녹강이었습니다.

다른 과제 유형은 모두 가져와졌지만, 녹강 과제만 아예 안불러와지거나 일부만 불러와지는 현상이 자주 나타났습니다.

팀원분이 10번 정도 간이로 테스트를 해본 결과 약 50%의 확률로 녹강 과제가 누락되는 것을 확인했습니다.

### 해결 방법

다른 과제 유형들은 모두 하나의 페이지에서 정보를 가져오지만, 녹강 과제는 여러 개의 페이지에서 정보를 가져온다는 점에서 문제 해결의 실마리를 찾았습니다.

코드를 재검토한 결과 비동기 함수 사용 과정에서 async/await 구문을 빼먹은 것을 발견했고, 약 10분만에 해결할 수 있었습니다.

### 버그가 발생한 코드 요약

문제가 생긴 코드를 간략하게 표현한 코드는 아래와 같습니다.

- fetch 함수를 통해 생기는 시간차를 setTimeout 함수로 대체하여 작성했습니다.

```javascript
FIRST_PROMISE_TIME = 1000;
SECOND_PROMISE_TIME = 1000;
THIRD_PROMISE_TIME = 1000;

async function getVideoInfo(courseIds) {
  const firstPromises = courseIds.map((courseId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(courseId);
      }, FIRST_PROMISE_TIME);
    });
  });

  const secondPromises = courseIds.map((courseId, index) => {
    const thirdPromises = [];
    return new Promise((resolve) => {
      setTimeout(() => {
        thirdPromises.push(
          new Promise((resolve2) => {
            setTimeout(() => {
              resolve2(courseId);
            }, THIRD_PROMISE_TIME);
          }),
        );
      }, SECOND_PROMISE_TIME);
      resolve(thirdPromises);
    });
  });

  const firstResult = await Promise.all(firstPromises);
  const secondResult = await Promise.all(
    (await Promise.all(secondPromises)).flat(),
  );

  return firstResult.filter((courseId) => secondResult.includes(courseId));
}

async function main() {
  const courseIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = await getVideoInfo(courseIds);
}

main();
```

SECOND_PROMISE_TIME이 짧다면 코드가 정상적으로 동작하는 것처럼 보이게 됩니다.

실제로 프로그램을 돌렸을 경우 네트워크 상태에 따라서 녹강 과제가 반영되었습니다.

### 깨달은 점 및 반성

위의 코드는 간략하게 작성했음에도 불구하고 매우 복잡하게 보입니다. 아무 생각없이 짜니 말로만 듣던 콜백 지옥을 만들게 됐네요.

들여쓰기가 많은 것 같으면 함수로 분리해내는 습관을 잘 기르고 콜백 함수는 빼내거나 async/await를 사용하여 가독성을 높여야할 필요가 있을 것 같습니다.
