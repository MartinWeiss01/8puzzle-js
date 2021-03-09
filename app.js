/* Implementation of GUI */
const puzzleInput = document.getElementById("puzzleInput"),
        puzzleOutput = document.getElementById("puzzleOutput"),
        puzzleCalculate = document.getElementById("puzzleCalculate"),
        solutionPrevious = document.getElementById("solutionPrevious"),
        solutionNext = document.getElementById("solutionNext"),
        spanTotalSteps = document.getElementById("totalsteps"),
        spanCurrentStep = document.getElementById("currentstep"),
        spanCurrentDir = document.getElementById("currentdir");

puzzleCalculate.addEventListener("click", () => {
    let inval = puzzleInput.value, outval = puzzleOutput.value;
    if(!(inval.includes(0)) || !(outval.includes(0))) return alert("Input or output does not including number '0'!");
    if((inval.length !== 9) || (outval.length !== 9)) return alert("Length of input or output is not 9 numbers (including 0)!");
    calculatePuzzle(inval, outval);
});

const dirs = {UP: [-1, 0], DOWN: [1, 0], RIGHT: [0, 1], LEFT: [0, -1]};

/* Show matrix in console */
const showMatrix = (arr, columns = 3) => {
    console.log("-------------");
    for(let i = 0; i < arr.length; i++) {
        let row = "|";
        for(let j = 0; j < columns; j++) row += ` ${arr[i][j]} |`;
        console.log(row);
    }
};

/* Duplicate matrix */
const copyMatrix = (original) => JSON.parse(JSON.stringify(original));

/* Compare two nodes */
const compareNodes = (arr1, arr2) => (JSON.stringify(arr1) === JSON.stringify(arr2));

/* Find position of null character (probably 0 or _) */
const findPositionOfNull = (array, nullchar = 0) => {
    let x, y;
    for(let i = 0; i < array.length; i++) {
        for(let j = 0; j < array[i].length; j++) {
            if(array[i][j] === nullchar) {
                x = j;
                y = i;
                break;
            }
        }
    }
    return {x: x, y: y};};

/* Calculate node H value (count of misplaced tiles) */
const calcMisplaced = (node, goal) => {
    let h = 0;
    for(let i = 0; i < node.length; i++) {
        for(let j = 0; j < node[i].length; j++) {
            if(node[i][j] !== 0 && (node[i][j] !== goal[i][j])) h++;
        }
    }
    return h;};

/* Parse input into the Matrix */
const fetchMatrix = (array, columns = 3) => {
    let nextrow = false, comrow = [], final = [];

    for(let i = 0; i < array.length; i++) {
        if(nextrow) {
            nextrow = false;
            final.push(comrow);
            comrow = [];
        }

        if(((i+1) % columns) === 0) nextrow = true;
        comrow.push(array[i]);
    }
    final.push(comrow);
    return final;};

const readMatrixString = (string, columns = 3) => fetchMatrix(string.split("").map(i => parseInt(i)), columns);

const moveNode = (originalNode, direction) => {
    let node = copyMatrix(originalNode), emptypos = findPositionOfNull(node), x = emptypos.x, y = emptypos.y;
    if(node[y+(dirs[direction][0])] === undefined) return 0;
    if(node[y+(dirs[direction][0])][x+(dirs[direction][1])] === undefined) return 0;
    node[y][x] = node[y+(dirs[direction][0])][x+(dirs[direction][1])];
    node[y+(dirs[direction][0])][x+(dirs[direction][1])] = 0;
    return node;};

/* ----------------------------------------------------------- */

let isGameReady = false,
    startNode,
    expectedNode,
    parentNode,
    closedpaths = [],
    historypath = [],
    historymoves = [null],
    displayedStep = 0,
    stepsCount = 0;

const renderPuzzle = () => {
    spanTotalSteps.innerText = stepsCount;
    spanCurrentStep.innerText = `${displayedStep}/${stepsCount}`;
    spanCurrentDir.innerText = (historymoves[displayedStep] === null ? "input" : historymoves[displayedStep]);
    for(let i = 0; i < historypath[displayedStep].length; i++) {
        for(let j = 0; j < historypath[displayedStep][i].length; j++) {
            let currentElement = document.getElementById(`l${i}c${j}`);
            currentElement.innerText = historypath[displayedStep][i][j];
            historypath[displayedStep][i][j] === 0 ? currentElement.classList.add("zeropos") : currentElement.classList.remove("zeropos");
        }
    }
};

const renderPuzzlex = () => {
    stepsCount = historymoves.length-1;
    displayedStep = 0;
    renderPuzzle();
    if(displayedStep === stepsCount) {
        solutionNext.setAttribute("disabled", "");
        solutionPrevious.setAttribute("disabled", "");
    } else solutionNext.removeAttribute("disabled");
};

const renderNext = () => {
    if(displayedStep === stepsCount) return;
    if((displayedStep+1) === stepsCount) solutionNext.setAttribute("disabled", "");
    solutionPrevious.removeAttribute("disabled");
    displayedStep++;
    renderPuzzle();
};

const renderPrevious = () => {
    if(displayedStep === 0) return;
    if((displayedStep-1) === 0) solutionPrevious.setAttribute("disabled", "");
    solutionNext.removeAttribute("disabled");
    displayedStep--;
    renderPuzzle();
};

function calculatePuzzle(initialState = "130425678", finalState = "123456780") {
    closedpaths = [], historypath = [], historymoves = [null];
    startNode = fetchMatrix(initialState.split("").map(i => parseInt(i)), 3),
    expectedNode = fetchMatrix(finalState.split("").map(i => parseInt(i)), 3);
    parentNode = copyMatrix(startNode);
    historypath.push(startNode);
    isGameReady = true;
    try {
        findDirectionWithLowestH();
    } catch (err) {
        alert("Solution of this puzzle could be problematic for memory - skipped");
    }
}


const wait = ms => new Promise((solution) => setTimeout(solution, ms));
function findDirectionWithLowestH(misplaced = 0) {
    if(compareNodes(parentNode, expectedNode)) {
        for(let i = 0; i < historypath.length; i++) {
            if(i !== 0) console.log(historymoves[i]);
            showMatrix(historypath[i]);
        }
        console.log(`-------------\nEnd\nSteps count: ${historymoves.length-1}`);
        renderPuzzlex();
        return 1;
    }

    let indexOfLowest, subnodes = [], submoves = [];
    for(let i = 0; i < Object.keys(dirs).length; i++) {
        let temp = moveNode(parentNode, Object.keys(dirs)[i]);
        if(temp !== 0) {
            if(!(JSON.stringify(closedpaths).includes(JSON.stringify(temp)))) {
                subnodes.push(temp);
                submoves.push(Object.keys(dirs)[i]);
                closedpaths.push(temp);
            }
        }
    }

    const subnodesHs = subnodes.map(ln => calcMisplaced(ln, expectedNode));
    indexOfLowest = subnodesHs.indexOf(Math.min.apply(Math, subnodesHs));
    historypath.push(subnodes[indexOfLowest]);
    historymoves.push(submoves[indexOfLowest]);
    parentNode = subnodes[indexOfLowest];
    return findDirectionWithLowestH(subnodesHs[indexOfLowest]);
}