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

    if (chg) {
      if (leftResult > 0 && rightResult <= 0) {
        sortResult.push(left[leftIndex]);
        leftIndex++;
      }

      if (rightResult > 0 && leftResult <= 0) {
        sortResult.push(right[rightIndex]);
        rightIndex++;
      }

      if (leftResult <= 0 && rightResult <= 0) {
        if (leftResult > rightResult) {
          sortResult.push(left[leftIndex]);
          leftIndex++;
        } else {
          sortResult.push(right[rightIndex]);
          rightIndex++;
        }
      }

      if (leftResult > 0 && rightResult > 0) {
        if (leftResult > rightResult) {
          sortResult.push(left[leftIndex]);
          leftIndex++;
        } else {
          sortResult.push(right[rightIndex]);
          rightIndex++;
        }
      }
    } else {
      if (leftResult > rightResult) {
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
