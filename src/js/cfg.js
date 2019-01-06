import * as esprima from 'esprima';

/* Declare globals */
let Index = 0;
let numberOfScopes = 0;
let nodes = {};
let funcScopeStr = '';
const NEW_LINE = '\n';

const HandlerFunctionDictionary = {
    'FunctionDeclaration': FunctionDeclarationHandlerFunction,
    'WhileStatement': WhileStatementHandlerFunction, /* while(){}*/
    'IfStatement': IfStatementHandlerFunction, /*if(){}*/
    'ReturnStatement': ReturnStatementHandlerFunction, /*return */
    'AssignmentExpression': AssignmentExpressionHandlerFunction,
    'BinaryExpression': BinaryExpressionHandlerFunction,
    'MemberExpression': MemberExpressionHandlerFunction,
    'UnaryExpression': UnaryExpressionHandlerFunction,
    'Literal': LiteralHandlerFunction,
    'Identifier': IdentifierHandlerFunction,
    'UpdateExpression': UpdateExpressionHandlerFunction,
    'VariableDeclaration': VariableDeclarationHandlerFunction, /* let a */
    'ExpressionStatement': ExpressionStatementHandlerFunction, /* */
    'BlockStatement': BlockStatementHandlerFunction,
    'Program': BlockStatementHandlerFunction,
    'ArrayExpression': ArrayExpressionHandlerFunction,
    // 'ForStatement': ForStatementHandlerFunction, /* for (){}*/
    // 'VariableDeclarator': VariableDeclaratorHandlerFunction,
    // 'ElseIfStatement': ElseIfStatementHandlerFunction, /*else if*/ managed by IfStatementHandlerFunction
    // 'CallExpression': CallExpressionHandlerFunction, /* */
    // 'ArrayExpression': ArrayExpressionHandlerFunction, /* let a = []; */
};

export function GetNodeMetaDataDict(info = [], subNodes = [], isPossible = false, path = undefined, condition = false, whileFlag = -1) {
    if (whileFlag !== -1)
        return {
            'info': info,
            'subNodes': subNodes,
            'isPossible': isPossible,
            'path': path,
            'condition': condition,
            'whileFlag': whileFlag,
        };
    else
        return {
            'info': info,
            'subNodes': subNodes,
            'isPossible': isPossible,
            'path': path,
            'condition': condition
        };
}

function IfStatementHandlerFunction(node, metadata, boolFlag, currentCondNodes, currentBlockNodes, isStatmentType = 'if', currentScopeStr = '') {
    let possibleFlag = boolFlag === undefined ? true : boolFlag;
    boolFlag = boolFlagCheck(currentScopeStr, boolFlag);
    let path = isStatmentType === 'if' ? undefined : false;
    initialIfNodeInDictionary(currentCondNodes, possibleFlag, path);
    if (!currentCondNodes) {
        currentCondNodes = [];
    }
    if (!currentBlockNodes) {
        currentBlockNodes = [];
    }
    boolFlag = ifToDict(node, metadata, boolFlag, currentCondNodes, currentBlockNodes, possibleFlag, isStatmentType, currentScopeStr);
    createNodeByType(node.consequent, metadata, boolFlag, currentScopeStr);
    CheckIfHasAlternateOrEndOfIfStatement(currentCondNodes, currentBlockNodes, node, metadata, boolFlag);
}

function ExpressionStatementHandlerFunction(node, metadata, boolFlag) {
    return createNodeByType(node.expression, metadata, boolFlag);
}

function AssignmentExpressionHandlerFunction(node, metadata, boolFlag) {
    let nodeName = createNodeByType(node.left, metadata, boolFlag);
    let nodeValue = createNodeByType(node.right, metadata, boolFlag);
    let retVal = nodeName + ' = ' + nodeValue;
    nodes[Index].info.push(retVal + NEW_LINE);
    funcScopeStr += retVal + ';';
}

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

function ResetGlobals() {
    Index = 1;
    nodes = {};
    numberOfScopes = 0;
}

function buildCfgStr(cfgString, nodeMapper) {
    let checkedNodes = [];
    for (let id in nodeMapper) {
        let nodesStringResult = buildNodeStr(cfgString, nodeMapper, id, checkedNodes);
        checkedNodes = nodesStringResult[0];
        cfgString = nodesStringResult[1];
    }
    return cfgString;
}

function getNodeInfo(infoList) {
    let retVal = '';
    for (let info in infoList)
        retVal += infoList[info];
    return retVal;
}

export function createCfgString() {
    let retVal = initializeNodeStr();
    let cfgString = retVal[0];
    let nodeMapper = retVal[1];
    return buildCfgStr(cfgString, nodeMapper);
}

function IdentifierHandlerFunction(node) {
    return node.name;
}

function LiteralHandlerFunction(node) {
    return node.raw;
}

function MemberExpressionHandlerFunction(node, metadata, boolFlag) {
    let varName = node.object.name;
    let memberIndex = createNodeByType(node.property, metadata, boolFlag);
    return varName + '[' + memberIndex + ']';
}

function boolFlagCheck(boolFlag) {
    return numberOfScopes === 1 ? false : boolFlag;
}

function ArrayExpressionHandlerFunction(node, metadata, boolFlag) {
    let nodes = [];
    node.elements.forEach(insideNode => {
        nodes.push(createNodeByType(insideNode, metadata, boolFlag));
    });
    return nodes;
}

export function buildCfgGraph(codeToParse, metadata) {
    ResetGlobals();
    funcScopeStr = buildArgDeclStr(metadata);
    nodes[Index] = GetNodeMetaDataDict([], [], true);
    let parsedCode = parseCode(codeToParse);
    parsedCode.body.forEach(node => {
        createNodeByType(node, metadata);
    });
    return createCfgString();
}


function createNodeByType(node, metadata, boolFlag = undefined) {
    return HandlerFunctionDictionary[node.type](node, metadata, boolFlag);
}

function FunctionDeclarationHandlerFunction(node, metadata, boolFlag) {
    createNodeByType(node.body, metadata, boolFlag);
}

function BinaryExpressionHandlerFunction(node, metadata, boolFlag) {
    let rightSide = createNodeByType(node.right, metadata, boolFlag);
    let leftSide = createNodeByType(node.left, metadata, boolFlag);
    let operator = node.operator;
    return leftSide + ' ' + operator + ' ' + rightSide;
}

function isNested(toValidateStr, boolFlag) {
    return 1 < numberOfScopes && boolFlag && eval(toValidateStr);
}

function isScopesAndStr(numberOfScopes, toValidateStr) {
    return 1 === numberOfScopes && eval(toValidateStr);
}

function ifToDict(node, metadata, boolFlag, currentCondNodes, currentBlockNodes, possibleFlag, type, currentScopeStr) {
    let condition = createNodeByType(node.test, metadata, boolFlag, currentScopeStr);
    boolFlag = evaluateCond(boolFlag, currentScopeStr, condition, numberOfScopes);
    currentCondNodes.push(Index);
    nodes[Index].info.push(condition);
    nodes[Index].isPossible = possibleFlag;
    nodes[Index].subNodes.push(++Index);
    nodes[Index] = GetNodeMetaDataDict([], [], boolFlag, true);
    currentBlockNodes.push(Index);
    let ifCond = 'if(' + condition + ')';
    if ('if' === type)
        funcScopeStr += ifCond;
    else
        funcScopeStr += 'else ' + ifCond;
    return boolFlag;
}

function VariableDeclarationHandlerFunction(node, metadata, boolFlag) {
    let retVal = '';
    let startIndex = 1;
    node.declarations.forEach(declaration => {
        let nodeVal = null;
        if (null !== declaration.init)
            nodeVal = createNodeByType(declaration.init, metadata, boolFlag);
        let declarationName = declaration.id.name;
        retVal += createVariableDeclarationString(declarationName, nodeVal, startIndex, node);
        startIndex++;
    });
    funcScopeStr += 'let ' + retVal + ';';
    nodes[Index].info.push(retVal + NEW_LINE);
}

function createVariableDeclarationString(varName, variableValue, startIndex, node) {
    let retVal = '';
    if (variableValue == null)
        retVal += varName;
    else
        retVal += !Array.isArray(variableValue) ? varName + ' = ' + variableValue : varName + ' = [' + variableValue + ']';
    retVal += startIndex < node.declarations.length ? ', ' : '';
    return retVal;
}

function WhileStatementHandlerFunction(node, metadata, boolFlag, currentScopeStr = '') {
    let possibleFlag = boolFlag === undefined ? true : boolFlag;
    boolFlag = boolFlagCheck(boolFlag);
    let whileCondition = createNodeByType(node.test, metadata, boolFlag);
    let toValidateStr = funcScopeStr;
    for (let i = 1; i < numberOfScopes; i++)
        toValidateStr += '}';
    toValidateStr += currentScopeStr + whileCondition + '}';
    boolFlag = !!(isNested(toValidateStr, boolFlag) || isScopesAndStr(numberOfScopes, toValidateStr));
    funcScopeStr += 'while(' + whileCondition + ')';
    whileToDict(node, metadata, boolFlag, currentScopeStr, possibleFlag, whileCondition);
}

function UnaryExpressionHandlerFunction(node, metadata, boolFlag) {
    let operator = node.operator;
    let expressionArgument = createNodeByType(node.argument, metadata, boolFlag);
    return operator + expressionArgument;
}

export function buildArgDeclStr(metadata) {
    let retVal = '';
    for (let arg in metadata) {
        retVal += 'let ' + arg + '=' + metadata[arg] + '; ';
    }
    return retVal;
}

export function evaluateCond(boolFlag, currentScopeStr, condition, numberOfScopes) {
    let toValidateStr = funcScopeStr;
    for (let i = 1; i < numberOfScopes; i++)
        toValidateStr += '}';
    toValidateStr += currentScopeStr + condition + '}';
    return !!(isNested(toValidateStr, boolFlag) || isScopesAndStr(numberOfScopes, toValidateStr));
}

function getCfgStrInputIdList(cfgString, nodeMapper, inputId) {
    let baseId = inputId;
    cfgString += nodeMapper[inputId] + '(yes)->' + nodeMapper[++inputId] + NEW_LINE;
    if (nodes[inputId].condition) {
        let conditionOutput = getCfgStrInputIdList(cfgString, nodeMapper, inputId);
        cfgString = conditionOutput[0];
        inputId = conditionOutput[1];
    }
    else {
        cfgString = addSubNodes(inputId, cfgString, nodeMapper);
    }
    if (nodes[inputId].path)
        inputId++;
    cfgString += nodeMapper[baseId] + '(no)->' + nodeMapper[inputId] + NEW_LINE;
    return [cfgString, inputId];
}

function addSubNodes(inputId, cfgString, nodeMapper) {
    for (let subNode in nodes[inputId].subNodes) {
        cfgString += nodeMapper[inputId] + '->' + nodeMapper[nodes[inputId].subNodes[subNode]] + NEW_LINE;
    }
    return cfgString;
}

function UpdateExpressionHandlerFunction(node, metadata, boolFlag) {
    let operator = node.operator;
    let argument = createNodeByType(node.argument, metadata, boolFlag);
    nodes[Index].info.push(argument + operator + NEW_LINE);
    funcScopeStr += argument + operator + ';';
    return argument + operator;
}

function iniWhileInDict(possibleFlag, condition) {
    if (0 === nodes[Index].info.length)
        nodes[Index].condition = true;
    else {
        nodes[Index].subNodes.push(++Index);
        nodes[Index] = GetNodeMetaDataDict([], [], possibleFlag, true, true);
    }
    nodes[Index].info.push(condition);
    nodes[Index].isPossible = possibleFlag;
    nodes[Index].subNodes.push(++Index);
}

function whileToDict(node, metadata, boolFlag, currentScopeStr, possibleFlag, condition) {
    iniWhileInDict(possibleFlag, condition);
    let whileNode = Index - 1;
    nodes[Index] = GetNodeMetaDataDict([], [], boolFlag, true);
    createNodeByType(node.body, metadata, boolFlag, currentScopeStr);
    nodes[Index].subNodes.push(whileNode);
    nodes[++Index] = GetNodeMetaDataDict([], [], possibleFlag, false, false, true);
    nodes[whileNode].subNodes.push(Index);
}

function initialIfNodeInDictionary(currentCondNodes, possibleFlag, path) {
    if (0 === nodes[Index].info.length)
        nodes[Index].condition = true;
    else {
        if (currentCondNodes) {
            nodes[currentCondNodes[currentCondNodes.length - 1]].subNodes.push(++Index);
        }
        else {
            nodes[Index].subNodes.push(++Index);
        }
        nodes[Index] = GetNodeMetaDataDict([], [], possibleFlag, path, true);
    }
}

function IfStatementNodeAlternateHandlerFunction(node, metadata, boolFlag, currentCondNodes, currentBlockNodes) {
    let nodeAlternate = node.alternate;
    if ('IfStatement' === nodeAlternate.type)
        IfStatementHandlerFunction(nodeAlternate, metadata, boolFlag, currentCondNodes, currentBlockNodes, 'else if');
    else
        ElseStatementNodeHandlerFunction(node, metadata, boolFlag, currentCondNodes, currentBlockNodes);
}

function initializeNodeStr() {
    let cfgString = '', condIndex = 1, opIndex = 1, startIndex = 1, nodeMapper = {};
    for (let nodeId in nodes) {
        if (nodes[nodeId].condition) {
            cfgString += 'cond' + condIndex + '=>condition: ### ' + nodeId + ' ###\n' + getNodeInfo(nodes[nodeId].info);
            nodeMapper[nodeId] = 'cond' + condIndex++;
        } else {
            if (0 < nodes[nodeId].info.length) {
                cfgString += 'op' + opIndex + '=>operation: ### ' + nodeId + ' ###\n' + getNodeInfo(nodes[nodeId].info);
                nodeMapper[nodeId] = 'op' + opIndex++;
            } else {
                cfgString += 'st' + startIndex + '=>start: ### ' + nodeId + ' ###\n' + getNodeInfo(nodes[nodeId].info);
                nodeMapper[nodeId] = 'st' + startIndex++;
            }
        }
        cfgString += nodes[nodeId].isPossible ? ' | approved\n' : '| else\n';
    }
    return [cfgString, nodeMapper];
}

function BlockStatementHandlerFunction(node, metadata, boolFlag) {
    numberOfScopes++;
    funcScopeStr += '{';
    node.body.forEach(node => {
        createNodeByType(node, metadata, boolFlag);
    });
    numberOfScopes--;
    funcScopeStr += '}';
}

function isNodeEndWhile() {
    return 0 === nodes[Index].info.length && undefined !== nodes[Index].whileFlag && nodes[Index].whileFlag;
}

function ReturnStatementHandlerFunction(node, metadata, boolFlag) {
    let retVal = createNodeByType(node.argument, metadata, boolFlag);
    let retStatementStr = 'return ' + retVal;
    if (isNodeEndWhile())
        nodes[Index].info.push(retStatementStr);
    else {
        nodes[Index].subNodes.push(++Index);
        nodes[Index] = GetNodeMetaDataDict([retStatementStr], [], true);
    }
}

function concatCondNodes(currentCondNodes) {
    if (nodes[Index].info.length > 0) {
        nodes[++Index] = GetNodeMetaDataDict([], [], true, false);
    }
    else if (isNodeEndWhile()) {
        nodes[Index].whileFlag = false;
    }
    currentCondNodes.forEach(node => {
        nodes[node].subNodes.push(Index);
    });
}

function buildNodeStr(cfgString, nodeMapper, id, checkedNodes) {
    if (nodes[id].condition) {
        let conditionOutput = getCfgStrInputIdList(cfgString, nodeMapper, id);
        cfgString = conditionOutput[0];
        let inputId = conditionOutput[1];
        for (let i = id; i <= inputId; i++) {
            checkedNodes.push(i);
        }
    }
    else {
        for (let subNode in nodes[id].subNodes) {
            cfgString += nodeMapper[id] + '->' + nodeMapper[nodes[id].subNodes[subNode]] + NEW_LINE;
        }
    }
    return [checkedNodes, cfgString];
}

function ElseStatementNodeHandlerFunction(node, metadata, boolFlag, currentCondNodes, currentBlockNodes) {
    nodes[currentCondNodes[currentCondNodes.length - 1]].subNodes.push(++Index);
    currentBlockNodes.push(Index);
    nodes[Index] = GetNodeMetaDataDict([], [], boolFlag, false);
    funcScopeStr += 'else';
    createNodeByType(node.alternate, metadata, boolFlag);
    currentCondNodes.push(Index);
    concatCondNodes(currentBlockNodes);
}

function CheckIfHasAlternateOrEndOfIfStatement(currentCondNodes, currentBlockNodes, node, metadata, boolFlag) {
    let nodeAlternate = node.alternate;
    if (null !== nodeAlternate && undefined !== nodeAlternate) {
        IfStatementNodeAlternateHandlerFunction(node, metadata, !boolFlag, currentCondNodes, currentBlockNodes);
    } else {
        if (1 === currentCondNodes.length)
            currentBlockNodes.push(currentCondNodes[0]);
        concatCondNodes(currentBlockNodes);
    }
}