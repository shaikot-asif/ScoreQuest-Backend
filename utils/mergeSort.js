function mergeSort(arr, statisticsCalculate, chg = false) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), statisticsCalculate, chg);
  const right = mergeSort(arr.slice(mid), statisticsCalculate, chg);

  return merge(left, right, statisticsCalculate, chg);
}

function merge(left, right, statisticsCalculate, chg) {
  let sortResult = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left?.length && rightIndex < right?.length) {
    let leftResult = statisticsCalculate(left[leftIndex]?.statistics);
    let rightResult = statisticsCalculate(right[rightIndex]?.statistics);

    // console.log(chg, leftResult, "leftResult", rightResult, "rightResult");

    if (chg) {
      if (leftResult > 0 && rightResult <= 0) {
        console.log("from first condition");
        sortResult.push(left[leftIndex]);
        leftIndex++;
      }

      if (rightResult > 0 && leftResult <= 0) {
        console.log("from first if else condition");
        sortResult.push(right[rightIndex]);
        rightIndex++;
      }

      if (leftResult <= 0 && rightResult <= 0) {
        console.log("from 2nd if condition");
        if (leftResult > rightResult) {
          console.log("from nested if condition");
          sortResult.push(left[leftIndex]);
          leftIndex++;
        } else {
          console.log("from last else");
          sortResult.push(right[rightIndex]);
          rightIndex++;
        }
      }

      if (leftResult > 0 && rightResult > 0) {
        if (leftResult > rightResult) {
          console.log("from new if condition");
          sortResult.push(left[leftIndex]);
          leftIndex++;
        } else {
          console.log("from last end else");
          sortResult.push(right[rightIndex]);
          rightIndex++;
        }
      }
    } else {
      if (leftResult > rightResult) {
        console.log("from main else");
        sortResult.push(left[leftIndex]);
        leftIndex++;
      } else {
        sortResult.push(right[rightIndex]);
        rightIndex++;
      }
    }
  }

  return sortResult
    .concat(left?.slice(leftIndex))
    .concat(right?.slice(rightIndex));
}

module.exports = mergeSort;
