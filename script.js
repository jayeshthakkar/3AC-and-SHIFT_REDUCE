document.getElementById('parseButton').addEventListener('click', handleParse);

function handleParse() {
    const grammarText = document.getElementById('grammar').value;
    const input = document.getElementById('inputString').value;
    const errorElement = document.getElementById('error');
    const outputBody = document.getElementById('outputBody');

    // Clear previous error and output
    errorElement.innerText = '';
    outputBody.innerHTML = '';

    try {
        const grammarRules = parseGrammar(grammarText);
        const { parsingSteps, threeAddressCode } = parseInput(input, grammarRules);
        displaySteps(parsingSteps);
        displayThreeAddressCode(threeAddressCode);
    } catch (e) {
        errorElement.innerText = e.message;
    }
}

function parseGrammar(grammarText) {
    const rules = {};
    grammarText.split('\n').forEach(line => {
        line = line.trim();
        if (line) {
            const [left, right] = line.split('->').map(s => s.trim());
            if (!left || !right) {
                throw new Error(`Invalid grammar rule: ${line}`);
            }
            if (!rules[left]) {
                rules[left] = [];
            }
            rules[left].push(right);
        }
    });
    return rules;
}

function parseInput(input, grammarRules) {
    const steps = [];
    const stack = [];
    const threeAddressCode = [];
    let buffer = input.split(' ').filter(token => token);
    let tempVarCount = 1;

    while (buffer.length > 0 || stack.length > 0) {
        if (buffer.length > 0) {
            stack.push(buffer.shift());
            steps.push({
                stack: [...stack],
                input: [...buffer],
                action: 'Shift'
            });
        }

        let reduced = false;
        for (const [nonTerminal, productions] of Object.entries(grammarRules)) {
            for (const production of productions) {
                const productionArray = production.split(' ');
                const stackStr = stack.slice(-productionArray.length).join(' ');
                if (stackStr === production) {
                    // Generate 3AC for this reduction
                    const threeAC = generateThreeAddressCode(production, nonTerminal, tempVarCount);
                    if (threeAC) {
                        threeAddressCode.push(threeAC);
                        tempVarCount++;
                    }

                    // Apply reduction
                    stack.splice(-productionArray.length);
                    stack.push(nonTerminal);
                    steps.push({
                        stack: [...stack],
                        input: [...buffer],
                        action: `Reduce ${production} to ${nonTerminal}`
                    });
                    reduced = true;
                    break;
                }
            }
            if (reduced) break;
        }

        if (!reduced && buffer.length === 0) {
            break;
        }
    }
    return { parsingSteps: steps, threeAddressCode };
}

function generateThreeAddressCode(production, nonTerminal, tempVarCount) {
    const tokens = production.split(' ');
    if (tokens.length === 3 && (tokens[1] === '+' || tokens[1] === '*' || tokens[1] === '-')) {
        const tempVar = `t${tempVarCount}`;
        return `${tempVar} = ${tokens[0]} ${tokens[1]} ${tokens[2]}`;
    }
    return null;
}

function displaySteps(steps) {
    const outputBody = document.getElementById('outputBody');
    steps.forEach(step => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${step.stack.join(' ') || '(empty)'}</td>
            <td>${step.input.join(' ') || '(empty)'}</td>
            <td>${step.action}</td>
        `;
        outputBody.appendChild(row);
    });
}

function displayThreeAddressCode(threeAddressCode) {
    const codeContainer = document.getElementById('threeAddressCode');
    codeContainer.innerHTML = '';
    threeAddressCode.forEach(line => {
        const codeLine = document.createElement('div');
        codeLine.innerText = line;
        codeContainer.appendChild(codeLine);
    });
}
