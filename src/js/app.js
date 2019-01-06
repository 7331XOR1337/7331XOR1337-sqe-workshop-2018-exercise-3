import $ from 'jquery';
import {buildCfgGraph} from './cfg';
import * as flowchart from 'flowchart.js';


$(document).ready(function () {
    $('#newArgumentBtn').click(() => {
        let stringToAdd = createHTMLArg();
        $('#newArgumentTable').append(stringToAdd);
    });

    $('#codeSubmissionButton').click(() => {
        codeSubmissionClicked();
    });
});

function createHTMLArg() {
    let varNameHTMLStr = '<td><label>Var Name: <input id="varName" type="text"></label></td>';
    let varValueHTMLStr = '<td><label>Var Value: <input id="varValue" type="text"></label></td>';
    return '<tr class="newArgCells">' + varNameHTMLStr + varValueHTMLStr + '</tr>';
}

function getNewArgs() {
    let argName = $(this).find('#varName').val();
    let argValue = $(this).find('#varValue').val();
    return {newArgName: argName, newArgValue: argValue};
}

function codeSubmissionClicked() {
    let inputs = {};
    $('tr.newArgCells').each(function () {
        let {newArgName, newArgValue} = getNewArgs.call(this);
        if (newArgValue.startsWith('[')) {
            newArgValue = newArgValue.substring(1, newArgValue.length - 1).replace(/ /g, '').split(',');
        }
        inputs[newArgName] = newArgValue;
    });
    let codeToParse = $('#codePlaceholder').val();
    let flowchartDiagram = flowchart.parse(buildCfgGraph(codeToParse, inputs));
    flowchartDiagram.drawSVG('diagram',
        {
            'flowstate': {
                'approved': {'fill': 'Yellow', 'font-size': 16, 'yes-text': 'True', 'no-text': 'False'},
                'else': {'yes-text': 'True', 'no-text': 'False'}
            }
        });
}















