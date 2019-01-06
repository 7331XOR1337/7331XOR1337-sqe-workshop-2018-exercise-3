import assert from 'assert';
import {evaluateCond, buildCfgGraph, buildArgDeclStr} from '../src/js/cfg';

describe('Test var creation', () => {
    it('Test1 var concat', () => {
        assert.equal(
            buildArgDeclStr({a: 1, b: 2, c: 3, d: 4, e: 5}), 'let a=1; let b=2; let c=3; let d=4; let e=5; '
        );
    });
});

describe('Test inside condition ', () => {
    it('Test1 base case', () => {
        assert.equal(evaluateCond(true, '', '{let a=10; let b=5; a>b', 1), true);
    });
    it('Test2 complicated case true', () => {
        assert.equal(evaluateCond(true, '', '{let a=10; let b=5; if(a>b) a=100; a>b', 1), true);
    });
});

describe('Test graph 1', () => {
    it('Test array', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let arr=[10, 20, 30, 40];\n' + 'var a = 0, b;\n' + 'arr[1]=40;\n' + 'if(arr[2]>arr[a])\n' + 'return arr[0];\n}', {}),
            'op1=>operation: ### 1 ###\narr = [10,20,30,40]\na = 0, b\narr[1] = 40\n | approved\ncond1=>condition: ### 2 ###\narr[2] > arr[a] | approved\nst1=>start: ### 3 ###\n | approved\nop2=>operation: ### 4 ###\nreturn arr[0] | approved\nst2=>start: ### 5 ###\n | approved\nop1->cond1\ncond1(yes)->st1\nst1->op2\nst1->st2\ncond1(no)->op2\nst1->op2\nst1->st2\n'
        );
    });
    it('Test array locals', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let arr=[10, 20, 30, 40];\n' + 'arr[2]=50;\n' + 'if(arr[0]<arr[2])\n' + 'return arr[0];}\n', {}),
            'op1=>operation: ### 1 ###\narr = [10,20,30,40]\narr[2] = 50\n | approved\ncond1=>condition: ### 2 ###\narr[0] < arr[2] | approved\nst1=>start: ### 3 ###\n | approved\nop2=>operation: ### 4 ###\nreturn arr[0] | approved\nst2=>start: ### 5 ###\n | approved\nop1->cond1\ncond1(yes)->st1\nst1->op2\nst1->st2\ncond1(no)->op2\nst1->op2\nst1->st2\n'
        );
    });
});

describe('Test graph 2', () => {
    it('Test if else', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let a=10;\n' + 'const b=20;\n' + 'var temp = a + 5;\n' + 'if(temp>b){\n' + 'a = 2*2}\n' +
                'else if(temp<b){\n' + 'a=b+1;}\n' + 'else\n' + 'b = b - a ;\n' + 'return a + b + temp;\n}', {}),
            'op1=>operation: ### 1 ###\na = 10\nb = 20\ntemp = a + 5\n | approved\ncond1=>condition: ### 2 ###\ntemp > b | approved\nop2=>operation: ### 3 ###\na = 2 * 2\n| else\ncond2=>condition: ### 4 ###\ntemp < b | approved\nop3=>operation: ### 5 ###\na = b + 1\n | approved\nop4=>operation: ### 6 ###\nb = b - a\n| else\nst1=>start: ### 7 ###\n | approved\nop5=>operation: ### 8 ###\nreturn a + b + temp | approved\nop1->cond1\ncond1(yes)->op2\nop2->st1\ncond1(no)->cond2\nop2->st1\ncond2(yes)->op3\nop3->st1\ncond2(no)->op4\nop3->st1\nop4->st1\nst1->op5\n'
        );
    });
    it('Test if else 2', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let a=10;\n' + 'var b=20;\n' + 'var temp = a + b;\n' + 'if(a>=b){\n' + 'a = b - a;}\n' +
                'else if(a<b){\n' + 'a=temp+100;}\n' + 'return temp - a - b;\n}', {}),
            'op1=>operation: ### 1 ###\na = 10\nb = 20\ntemp = a + b\n | approved\ncond1=>condition: ### 2 ###\na >= b | approved\nop2=>operation: ### 3 ###\na = b - a\n| else\ncond2=>condition: ### 4 ###\na < b | approved\nop3=>operation: ### 5 ###\na = temp + 100\n | approved\nst1=>start: ### 6 ###\n | approved\nop4=>operation: ### 7 ###\nreturn temp - a - b | approved\nop1->cond1\ncond1(yes)->op2\nop2->st1\ncond1(no)->cond2\nop2->st1\ncond2(yes)->op3\nop3->st1\ncond2(no)->st1\nop3->st1\nst1->op4\n'
        );
    });
});

describe('Test graph 3', () => {
    it('Test simple if', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let a=100;\n' + 'const b=200;\n' + 'var temp = a - 50;\n' + 'if(a>b)\n' + 'a = 2;\n' + 'if(a<b)\n' + 'a = 3;\n' + 'return temp;}', {}),
            'op1=>operation: ### 1 ###\na = 100\nb = 200\ntemp = a - 50\n | approved\ncond1=>condition: ### 2 ###\na > b | approved\nop2=>operation: ### 3 ###\na = 2\n| else\ncond2=>condition: ### 4 ###\na < b | approved\nop3=>operation: ### 5 ###\na = 3\n | approved\nst1=>start: ### 6 ###\n | approved\nop4=>operation: ### 7 ###\nreturn temp | approved\nop1->cond1\ncond1(yes)->op2\nop2->cond2\ncond1(no)->cond2\nop2->cond2\ncond2(yes)->op3\nop3->st1\ncond2(no)->st1\nop3->st1\nst1->op4\n'
        );
    });
    it('Test nested if', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'var a = 5;\n' + 'var b=10;\n' + 'if(a>1){\n' + 'if(a>b-7){\n' + 'a = a + 20;}}\n' + 'return b;}\n', {}),
            'op1=>operation: ### 1 ###\na = 5\nb = 10\n | approved\ncond1=>condition: ### 2 ###\na > 1 | approved\ncond2=>condition: ### 3 ###\na > b - 7 | approved\nop2=>operation: ### 4 ###\na = a + 20\n| else\nst1=>start: ### 5 ###\n | approved\nop3=>operation: ### 6 ###\nreturn b | approved\nop1->cond1\ncond1(yes)->cond2\ncond2(yes)->op2\nop2->st1\ncond2(no)->st1\ncond1(no)->st1\ncond2(yes)->op2\nop2->st1\ncond2(no)->st1\nop2->st1\nst1->op3\n'
        );
    });
});

describe('Test graph 4', () => {
    it('Test simple while', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'let a=10, b=20;\n' + 'b--;\n' + 'let temp = a;\n' + 'while(temp>b)\n' + 'b = temp + 3;\n' + 'return temp;}', {}),
            'op1=>operation: ### 1 ###\na = 10, b = 20\nb--\ntemp = a\n | approved\ncond1=>condition: ### 2 ###\ntemp > b | approved\nop2=>operation: ### 3 ###\nb = temp + 3\n| else\nop3=>operation: ### 4 ###\nreturn temp | approved\nop1->cond1\ncond1(yes)->op2\nop2->cond1\ncond1(no)->op3\nop2->cond1\n'
        );
    });
    it('Test nested while', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'var a = 2;\n' + 'var b=20;\n' + 'if(a>1){\n' + 'while(a==2){\n' + 'a++;}}\n' + 'return a*2;}\n', {}),
            'op1=>operation: ### 1 ###\na = 2\nb = 20\n | approved\ncond1=>condition: ### 2 ###\na > 1 | approved\ncond2=>condition: ### 3 ###\na == 2 | approved\nop2=>operation: ### 4 ###\na++\n | approved\nst1=>start: ### 5 ###\n | approved\nop3=>operation: ### 6 ###\nreturn a * 2 | approved\nop1->cond1\ncond1(yes)->cond2\ncond2(yes)->op2\nop2->cond2\ncond2(no)->st1\ncond1(no)->st1\ncond2(yes)->op2\nop2->cond2\ncond2(no)->st1\nop2->cond2\nst1->op3\n'
        );
    });
});

describe('Test graph 5', () => {
    it('Test unary', () => {
        assert.equal(
            buildCfgGraph('function foo(){\n' + 'var someBool=true;\n' + 'if(!someBool)\n' + 'return someBool;}', {}),
            'op1=>operation: ### 1 ###\nsomeBool = true\n | approved\ncond1=>condition: ### 2 ###\n!someBool | approved\nst1=>start: ### 3 ###\n| else\nop2=>operation: ### 4 ###\nreturn someBool | approved\nst2=>start: ### 5 ###\n | approved\nop1->cond1\ncond1(yes)->st1\nst1->op2\nst1->st2\ncond1(no)->op2\nst1->op2\nst1->st2\n'
        );
    });
});