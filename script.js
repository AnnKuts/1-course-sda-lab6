document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const seed = 4111;
    const n3 = 1;
    const n4 = 1;
    const n = 10 + n3;
    const k = 1.0 - n3 * 0.01 - n4 * 0.005 - 0.05; // Виправлена формула для k

    function genRand(seed) {
        const MOD = 2147483647;
        let val = seed % MOD;
        return function () {
            val = (val * 16807) % MOD;
            return (val - 1) / MOD;
        };
    }

    const rand = genRand(seed);

    function genDirMatrix(k) {
        const raw = Array.from({length: n}, () =>
            Array.from({length: n}, () => rand() * 2)
        );
        const dir = raw.map(row => row.map(v => (v * k >= 1 ? 1 : 0)));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (dir[i][j] && dir[j][i]) {
                    if (rand() < 0.5) dir[i][j] = 0;
                    else dir[j][i] = 0;
                }
            }
        }

        return dir;
    }

    function genUndirMatrix(dir) {
        const undir = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dir[i][j] || dir[j][i]) undir[i][j] = undir[j][i] = 1;
            }
        }
        return undir;
    }

    function genMatrixB() {
        const B = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Заповнюємо випадковими значеннями від 0 до 2
                B[i][j] = rand() * 2; // Діапазон [0, 2)
            }
        }
        return B;
    }

    function createMatrixC(B, Aundir) {
        const C = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Використовуємо точну формулу з умови
                C[i][j] = Math.ceil(B[i][j] * 100 * Aundir[i][j]);
            }
        }
        return C;
    }

    function createMatrixD(C) {
        const D = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                D[i][j] = C[i][j] > 0 ? 1 : 0;
            }
        }
        return D;
    }

    function createMatrixH(D) {
        const H = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                H[i][j] = D[i][j] !== D[j][i] ? 1 : 0;
            }
        }
        return H;
    }

    function createMatrixTr() {
        const Tr = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                Tr[i][j] = i < j ? 1 : 0;
            }
        }
        return Tr;
    }

    // 6) Створення матриці ваг W: wij = wji = (dij + hij · trij) · cij
    function createMatrixW(D, H, Tr, C) {
        const W = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Обчислюємо вагу за формулою з зображення
                const weight = (D[i][j] + H[i][j] * Tr[i][j]) * C[i][j];
                // Матриця W симетрична: wij = wji
                W[i][j] = W[j][i] = weight;
            }
        }
        return W;
    }

    function getAllEdges(W) {
        const edges = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (W[i][j] > 0) {
                    edges.push({
                        from: i,
                        to: j,
                        weight: W[i][j]
                    });
                }
            }
        }
        edges.sort((a, b) => a.weight - b.weight);
        return edges;
    }

    function primMSTSteps(W) {
        const n = W.length;
        const selected = Array(n).fill(false);
        const parent = Array(n).fill(-1);
        const key = Array(n).fill(Infinity);
        const steps = [];

        key[0] = 0;
        for (let count = 0; count < n; count++) {
            let minVal = Infinity;
            let minIndex = -1;

            for (let v = 0; v < n; v++) {
                if (!selected[v] && key[v] < minVal) {
                    minVal = key[v];
                    minIndex = v;
                }
            }

            if (minIndex === -1) break;

            const u = minIndex;
            selected[u] = true;
            if (parent[u] !== -1) {
                steps.push({
                    from: parent[u],
                    to: u,
                    weight: W[u][parent[u]],
                    selected: [...selected],
                    currentStep: count
                });
            }

            for (let v = 0; v < n; v++) {
                if (W[u][v] && !selected[v] && W[u][v] < key[v]) {
                    parent[v] = u;
                    key[v] = W[u][v];
                }
            }
        }

        return {
            steps: steps,
            parent: parent
        };
    }

    function primMST(W) {
        const n = W.length;
        const selected = Array(n).fill(false);
        const parent = Array(n).fill(-1);
        const key = Array(n).fill(Infinity);

        key[0] = 0; // Починаємо з вершини 0

        for (let count = 0; count < n - 1; count++) {
            let minVal = Infinity;
            let minIndex = -1;

            for (let v = 0; v < n; v++) {
                if (!selected[v] && key[v] < minVal) {
                    minVal = key[v];
                    minIndex = v;
                }
            }

            const u = minIndex;
            selected[u] = true;

            for (let v = 0; v < n; v++) {
                if (W[u][v] && !selected[v] && W[u][v] < key[v]) {
                    parent[v] = u;
                    key[v] = W[u][v];
                }
            }
        }

        return parent;
    }

    function createMSTMatrix(parent) {
        const mstMatrix = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 1; i < n; i++) {
            if (parent[i] !== -1) {
                mstMatrix[i][parent[i]] = 1;
                mstMatrix[parent[i]][i] = 1;
            }
        }
        return mstMatrix;
    }

    function createPartialMSTMatrix(steps, currentStep) {
        const mstMatrix = Array.from({length: n}, () => Array(n).fill(0));
        for (let i = 0; i <= currentStep; i++) {
            if (i < steps.length) {
                const step = steps[i];
                mstMatrix[step.from][step.to] = 1;
                mstMatrix[step.to][step.from] = 1;
            }
        }
        return mstMatrix;
    }

    function printMatrix(matrix, title) {
        console.log(`\n${title}:`);
        matrix.forEach(row => console.log(row.join(" ")));
    }

    function printEdges(edges, title) {
        console.log(`\n${title}:`);
        edges.forEach((edge, index) => {
            console.log(`Ребро ${edge.from + 1}-${edge.to + 1}, вага: ${edge.weight}`);
        });
    }

    const w = canvas.width;
    const h = canvas.height;
    const RAD = 20;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 280;

    const positions = Array.from({length: n}, (_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    function distanceToLine(p1, p2, p) {
        const A = p.x - p1.x, B = p.y - p1.y;
        const C = p2.x - p1.x, D = p2.y - p1.y;
        const dot = A * C + B * D, len2 = C * C + D * D;
        const param = dot / len2;
        let xx, yy;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        const dx = p.x - xx, dy = p.y - yy;
        return Math.hypot(dx, dy);
    }

    function drawArrow(p1, p2, cp = null, offsetForWeight = false) {
        let angle;
        let arrowStart = {x: p2.x, y: p2.y};

        if (cp) {
            const t = offsetForWeight ? 0.88 : 0.95; // Зменшуємо довжину стрілки, якщо є вага
            const x = (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * cp.x + t ** 2 * p2.x;
            const y = (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * cp.y + t ** 2 * p2.y;
            const dx = 2 * (1 - t) * (cp.x - p1.x) + 2 * t * (p2.x - cp.x);
            const dy = 2 * (1 - t) * (cp.y - p1.y) + 2 * t * (p2.y - cp.y);
            angle = Math.atan2(dy, dx);
            arrowStart = {x, y};
        } else {
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            angle = Math.atan2(dy, dx);
            const offset = offsetForWeight ? RAD * 1.5 : RAD;
            arrowStart = {
                x: p2.x - offset * Math.cos(angle),
                y: p2.y - offset * Math.sin(angle)
            };
        }

        ctx.beginPath();
        ctx.moveTo(arrowStart.x, arrowStart.y);
        ctx.lineTo(
            arrowStart.x - 10 * Math.cos(angle - Math.PI / 8),
            arrowStart.y - 10 * Math.sin(angle - Math.PI / 8)
        );
        ctx.lineTo(
            arrowStart.x - 10 * Math.cos(angle + Math.PI / 8),
            arrowStart.y - 10 * Math.sin(angle + Math.PI / 8)
        );
        ctx.closePath();
        ctx.fill();
    }

    function drawSelfLoop(nodeX, nodeY, directed, weight = null) {
        const arcR = RAD * 0.75;           // радіус петлі
        const offset = RAD + 10;     // відступ від центру вершини

        const dx = nodeX - centerX;
        const dy = nodeY - centerY;
        let theta = Math.atan2(dy, dx) * 180 / Math.PI; // градуси
        if (theta < 0) theta += 360;

        let cx, cy, start, end;
        if (theta >= 315 || theta < 45) {
            cx = nodeX + offset;
            cy = nodeY;
            start = -135 * Math.PI / 180;
            end = 135 * Math.PI / 180;
        } else if (theta >= 45 && theta < 135) {
            cx = nodeX;
            cy = nodeY + offset;
            start = 225 * Math.PI / 180;
            end = 135 * Math.PI / 180;
        } else if (theta >= 135 && theta < 225) {
            cx = nodeX - offset;
            cy = nodeY;
            start = 45 * Math.PI / 180;
            end = -45 * Math.PI / 180;
        } else {
            cx = nodeX;
            cy = nodeY - offset;
            start = 45 * Math.PI / 180;
            end = -45 * Math.PI / 180;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, arcR, start, end, false);
        ctx.stroke();

        if (weight !== null) {
            ctx.font = "bold 14px Times New Roman";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const midAngle = (start + end) / 2;
            const weightX = cx + arcR * 1.5 * Math.cos(midAngle);
            const weightY = cy + arcR * 1.5 * Math.sin(midAngle);

            const textWidth = ctx.measureText(weight.toString()).width;
            ctx.fillStyle = "#fff";
            ctx.fillRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;
            ctx.strokeRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

            ctx.fillStyle = "#000";
            ctx.fillText(weight.toString(), weightX, weightY);
        }

        if (!directed) return;

        const ax = cx + arcR * Math.cos(end);
        const ay = cy + arcR * Math.sin(end);
        const arrowAngle = Math.atan2(nodeY - ay, nodeX - ax);
        const L = 0.55 * arcR;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
            ax - L * Math.cos(arrowAngle - Math.PI / 6),
            ay - L * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
            ax - L * Math.cos(arrowAngle + Math.PI / 6),
            ay - L * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    function drawEdge(p1, p2, weight = null, isMstEdge = false, curved = false, cp = null, isHighlighted = false) {
        ctx.save();

        if (isHighlighted) {
            ctx.strokeStyle = "#FF5722"; // Яскраве виділення для поточного кроку
            ctx.lineWidth = 4;
        } else if (isMstEdge) {
            ctx.strokeStyle = "hotpink";
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        if (curved && cp) {
            ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
        } else {
            ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();

        if (weight !== null) {
            ctx.font = "bold 14px Times New Roman";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let weightX, weightY;

            if (curved && cp) {
                weightX = cp.x;
                weightY = cp.y;
            } else {
                weightX = (p1.x + p2.x) / 2;
                weightY = (p1.y + p2.y) / 2;
            }

            const textWidth = ctx.measureText(weight.toString()).width;

            ctx.fillStyle = "#fff";
            ctx.fillRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

            ctx.strokeStyle = isHighlighted ? "#FF5722" : isMstEdge ? "hotpink" : "#333";
            ctx.lineWidth = 1;
            ctx.strokeRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

            ctx.fillStyle = isHighlighted ? "#FF5722" : isMstEdge ? "hotpink" : "#000";
            ctx.fillText(weight.toString(), weightX, weightY);
        }
        ctx.restore();
    }

    function drawCurrentMSTStep(step) {
        ctx.clearRect(0, 0, w, h);
        const partialMatrix = createPartialMSTMatrix(mstSteps, currentMSTStepIndex);
        positions.forEach((pos, idx) => {
            pos.index = idx;
        });
        for (let i = 0; i < n; i++) {
            if (undirMatrix[i][i]) {  // Якщо є петля
                drawSelfLoop(positions[i].x, positions[i].y, false, weightMatrix[i][i]);
            }
        }
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {  // Малюємо ребра між різними вершинами
                if (undirMatrix[i][j]) {
                    const p1 = positions[i], p2 = positions[j];

                    const isMstEdge = partialMatrix[i][j] === 1;

                    const isCurrentStep = step && (
                        (step.from === i && step.to === j) ||
                        (step.from === j && step.to === i)
                    );

                    let curved = false, cp = null;
                    for (let k2 = 0; k2 < n; k2++) {
                        if (k2 === i || k2 === j) continue;
                        if (distanceToLine(p1, p2, positions[k2]) < 25) {
                            curved = true;
                            const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
                            const perp = {x: -(p2.y - p1.y), y: p2.x - p1.x};
                            const len = Math.hypot(perp.x, perp.y);
                            const dirSign = i < j ? 1 : -1;
                            cp = {
                                x: mid.x + dirSign * (perp.x / len) * 90,
                                y: mid.y + dirSign * (perp.y / len) * 90
                            };
                            break;
                        }
                    }

                    drawEdge(
                        p1, p2,
                        weightMatrix[i][j],
                        isMstEdge,
                        curved,
                        cp,
                        isCurrentStep
                    );
                }
            }
        }

        for (let i = 0; i < n; i++) {
            ctx.beginPath();

            const isSelected = step ? step.selected[i] : false;

            ctx.fillStyle = isSelected ? "hotpink" : "#fff";

            ctx.arc(positions[i].x, positions[i].y, RAD, 0, 2 * Math.PI);
            ctx.fill();

            if (!isSelected) {
                ctx.stroke();
            }

            ctx.fillStyle = isSelected ? "#fff" : "#000";
            ctx.font = "14px Times New Roman";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(i + 1, positions[i].x, positions[i].y);
        }

        ctx.font = "bold 18px Times New Roman";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";


    }

    function isVertexInMST(vertex, mst) {
        if (!mst) return false;
        if (vertex === 0) return true;

        for (let i = 0; i < mst.length; i++) {
            if (mst[i] === vertex) return true;
        }

        return mst[vertex] !== -1;
    }

    let mstParent = null;
    let weightMatrix = null;
    let mstSteps = [];
    let currentMSTStepIndex = -1;
    let isMSTVisualizationReady = false;

    function drawGraph(matrix, directed, withWeights = false, mst = null) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#333";
        ctx.fillStyle = "#000";

        positions.forEach((pos, idx) => {
            pos.index = idx;
        });

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (!matrix[i][j]) continue;
                if (!directed && j < i) continue;

                if (i === j) {
                    const weight = withWeights ? weightMatrix[i][j] : null;
                    drawSelfLoop(positions[i].x, positions[i].y, directed, weight);
                    continue;
                }

                const p1 = positions[i], p2 = positions[j];
                let curved = false, cp = null;
                for (let k2 = 0; k2 < n; k2++) {
                    if (k2 === i || k2 === j) continue;
                    if (distanceToLine(p1, p2, positions[k2]) < 25) {
                        curved = true;
                        const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
                        const perp = {x: -(p2.y - p1.y), y: p2.x - p1.x};
                        const len = Math.hypot(perp.x, perp.y);
                        const dirSign = i < j ? 1 : -1;
                        cp = {
                            x: mid.x + dirSign * (perp.x / len) * 90,
                            y: mid.y + dirSign * (perp.y / len) * 90
                        };
                        break;
                    }
                }

                const isMstEdge = mst && ((mst[j] === i) || (mst[i] === j));
                const weight = withWeights ? weightMatrix[i][j] : null;

                if (directed) {
                    const offsetArrow = withWeights;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    if (curved) ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
                    else ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    if (withWeights) {
                        ctx.font = "bold 14px Times New Roman";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        let weightX, weightY;

                        if (curved && cp) {
                            weightX = cp.x;
                            weightY = cp.y;
                        } else {
                            weightX = (p1.x + p2.x) / 2;
                            weightY = (p1.y + p2.y) / 2;
                        }

                        const textWidth = ctx.measureText(weight.toString()).width;

                        ctx.fillStyle = "#fff";
                        ctx.fillRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

                        ctx.strokeStyle = "#333";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(weightX - textWidth/2 - 5, weightY - 10, textWidth + 10, 20);

                        // Малюємо текст
                        ctx.fillStyle = "#000";
                        ctx.fillText(weight.toString(), weightX, weightY);
                    }

                    // Малюємо стрілку зі зміщенням, якщо потрібно
                    drawArrow(p1, p2, curved ? cp : null, offsetArrow);
                } else {
                    drawEdge(p1, p2, weight, isMstEdge, curved, cp);
                }
            }
        }

        for (let i = 0; i < n; i++) {
            ctx.beginPath();
            const isInMST = mst && isVertexInMST(i, mst);

            ctx.fillStyle = isInMST ? "hotpink" : "#fff";
            ctx.arc(positions[i].x, positions[i].y, RAD, 0, 2 * Math.PI);
            ctx.fill();

            if (!isInMST) {
                ctx.stroke();
            }

            ctx.fillStyle = isInMST ? "#fff" : "#000";
            ctx.font = "14px Times New Roman";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(i + 1, positions[i].x, positions[i].y);
        }
    }

    const dirMatrix = genDirMatrix(k);
    const undirMatrix = genUndirMatrix(dirMatrix);

    const B = genMatrixB();
    const C = createMatrixC(B, undirMatrix);
    const D = createMatrixD(C);
    const H = createMatrixH(D);
    const Tr = createMatrixTr();
    weightMatrix = createMatrixW(D, H, Tr, C);

    document.getElementById("btnDirected").onclick = () => {
        console.clear();
        printMatrix(dirMatrix, "Directed Matrix (Adir)");
        printMatrix(B, "Matrix B");
        printMatrix(C, "Matrix C");
        printMatrix(D, "Matrix D");
        printMatrix(H, "Matrix H");
        printMatrix(Tr, "Matrix Tr");
        printMatrix(weightMatrix, "Матриця ваг (W)");
        drawGraph(dirMatrix, true);
        document.getElementById("btnNext").disabled = true;
        isMSTVisualizationReady = false;
        document.getElementById("btnNext").textContent = "Next";
    };

    document.getElementById("btnUndirected").onclick = () => {
        console.clear();
        printMatrix(undirMatrix, "Undirected Matrix (Aundir)");
        drawGraph(undirMatrix, false);
        document.getElementById("btnNext").disabled = true;
        isMSTVisualizationReady = false;
        document.getElementById("btnNext").textContent = "Next";
    };

    document.getElementById("btnWeighted").onclick = () => {
        console.clear();
        printMatrix(weightMatrix, "Матриця ваг (W)");

        const allEdges = getAllEdges(weightMatrix);
        printEdges(allEdges, "Усі ребра графа (відсортовані за вагою)");
        const mstResult = primMSTSteps(weightMatrix);
        mstSteps = mstResult.steps;
        mstParent = mstResult.parent;
        currentMSTStepIndex = -1;
        isMSTVisualizationReady = true;
        drawGraph(undirMatrix, false, true);

        document.getElementById("btnNext").disabled = false;
        document.getElementById("btnNext").textContent = "Next";

        console.log("\nНатисніть кнопку 'Next' для покрокової візуалізації алгоритму Прима");
    };

    document.getElementById("btnNext").onclick = () => {
        if (!isMSTVisualizationReady) return;

        currentMSTStepIndex++;

        if (currentMSTStepIndex < mstSteps.length) {
            const step = mstSteps[currentMSTStepIndex];
            drawCurrentMSTStep(step);
            console.log(`Крок ${currentMSTStepIndex + 1}: Додаємо ребро ${step.from + 1}-${step.to + 1} з вагою ${step.weight}`);
        } else if (currentMSTStepIndex === mstSteps.length) {
            const mstMatrix = createMSTMatrix(mstParent);
            drawGraph(mstMatrix, false, true, mstParent);
            let totalWeight = 0;
            for (let i = 1; i < n; i++) {
                if (mstParent[i] !== -1) {
                    totalWeight += weightMatrix[i][mstParent[i]];
                }
            }

            ctx.font = "bold 18px Times New Roman";
            ctx.fillStyle = "hotpink";
            ctx.textAlign = "center";

            console.log(`\nЗагальна вага: ${totalWeight}`);
            console.log("\nРебра кістяка:");
            for (let i = 1; i < n; i++) {
                if (mstParent[i] !== -1) {
                    console.log(`Ребро ${mstParent[i] + 1}-${i + 1}, вага: ${weightMatrix[i][mstParent[i]]}`);
                }
            }

            document.getElementById("btnNext").textContent = "Reset";
        } else {
            drawGraph(undirMatrix, false, true);
            currentMSTStepIndex = -1;
            document.getElementById("btnNext").textContent = "Next";
        }
    };

    document.getElementById("btnMST").onclick = () => {
        console.clear();
        printMatrix(weightMatrix, "Матриця ваг (W)");
        mstParent = primMST(weightMatrix);

        const mstMatrix = createMSTMatrix(mstParent);
        printMatrix(mstMatrix, "Матриця кістяка");

        const allEdges = getAllEdges(weightMatrix);

        printEdges(allEdges, "Усі ребра графа (відсортовані за вагою)");

        console.log("\nРебра кістяка (алгоритм Прима):");
        let totalWeight = 0;
        for (let i = 1; i < n; i++) {
            if (mstParent[i] !== -1) {
                console.log(`Ребро ${mstParent[i] + 1}-${i + 1}, вага: ${weightMatrix[i][mstParent[i]]}`);
                totalWeight += weightMatrix[i][mstParent[i]];
            }
        }
        console.log(`Загальна вага: ${totalWeight}`);

        drawGraph(mstMatrix, false, true, mstParent);

        ctx.font = "bold 18px Times New Roman";
        ctx.fillStyle = "hotpink";
        ctx.textAlign = "center";

        document.getElementById("btnNext").disabled = true;
        isMSTVisualizationReady = false;
        document.getElementById("btnNext").textContent = "Next";
    };
    document.getElementById("btnDirected").click();
});