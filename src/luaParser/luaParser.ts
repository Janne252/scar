import {Diagnostic, DiagnosticSeverity, Position, Range, TextDocument} from 'vscode';
import ObjectIterator from '../helper/objectIterator';

import * as luaparse from 'luaparse';

import LuaParserCallExpression from './callExpression';
import {DumpJSON} from '../scar';

/**
 * Wraps luaparser.
 */
export default class LuaParser
{
    public callExpressions: LuaParserCallExpression[];

    public identifiers: luaparse.ILuaParseNode[];
    /**
     * Current text document to parse.
     */
    public textDocument: TextDocument;
    /**
     * ILuaParserOptions used to parse.
     */
    public options: luaparse.ILuaParseOptions;
    /**
     * Result AST tree from the luaparser.
     */
    public ast: luaparse.ILuaParseAstRootNode;
    /**
     * Whether or not the most recent parse was completed without errors.
     */
    public valid: boolean = true;
    /**
     * Last parsing error.
     */
    public lastError: Error = undefined;
    /**
     * Creates a new instance of LuaParser.
     * @param options ILuaParserOptions used to parse.
     */
    constructor(options: luaparse.ILuaParseOptions)
    {
        this.options = options;
    }
    /**
     * Parses the current TextDocument.
     */
    protected parse(): luaparse.ILuaParseAstRootNode
    {
        return luaparse.parse(this.textDocument.getText(), this.options);
    }
    /**
     * Attempts to parse an AST tree from raw text.
     * @param text The text to parse.
     */
    public tryParseAstFromText(text: string): luaparse.ILuaParseAstRootNode
    {
        try
        {
            return luaparse.parse(text, this.options);
        }
        catch (error)
        {
            return undefined;
        }
    }
    /**
     * Attempts to parse the current TextDocument.
     */
    public tryParse(): void
    {
        try
        {
            let result = this.parse();
            
            this.ast = result;
            this.valid = true;
            this.lastError = undefined;
        }
        catch(error)
        {   
            this.valid = false;
            this.lastError = error;
        }
        finally
        {

        }
    }
    /**
     * Gets the node at the provided Position.
     * @param position The position to extract the node from.
     */
    public getNodeAt(pos: Position): luaparse.ILuaParseNode
    {
        let result: luaparse.ILuaParseNode;

        ObjectIterator.each(this.ast, function(key, item: luaparse.ILuaParseNode)
        {
            if (item !== null && item.loc !== undefined)
            {
                let range = new Range(
                    new Position(item.loc.start.line - 1, item.loc.start.column - 1), 
                    new Position(item.loc.end.line - 1, item.loc.end.column - 1)
                );

                if (range.contains(pos))
                {
                    result = item;
                }
            }
        });

        return result;
    }
    /**
     * Gets the call epxression at the provided Position.
     * @param position The position to extract the call expression from.
     */
    public getCallExpressionAt(position: Position): LuaParserCallExpression
    {
        let result: LuaParserCallExpression;

        ObjectIterator.each(this.ast, function(key, value: luaparse.ILuaParseCallExpressionNode)
        {
            if (value !== null && value.type === 'CallExpression')
            {
                let item = new LuaParserCallExpression(value);
                
                if (item.base.name === undefined && item.base.type == 'MemberExpression')
                {
                    item.base.name = item.getMemberCallExpressionName();
                }
                
                if (item.isPositionInArgumentsRange(position))
                {
                    result = item;
                }
            }
        });

        return result;
    }
    public parseCallExpressionsAndDefinitions(): void
    {
        this.callExpressions = [];
        this.identifiers = [];

        ObjectIterator.each(this.ast, (key: any, value: any) => 
        {
            if (value != null)
            {
                if (value.type === 'CallExpression')
                {
                    let expression = new LuaParserCallExpression(value);

                    if (expression.base.name === undefined && expression.base.type == 'MemberExpression')
                    {
                        expression.base.name = expression.getMemberCallExpressionName();
                    }

                    this.callExpressions.push(expression);
                }
                else if (value.type == 'Identifier')
                {
                    this.identifiers.push(value);
                }
            }
        });
    }
}

export function LuaParserTreeLocationToRange(loc: luaparse.ILuaParseNodeLocation): Range
{
    return new Range(
        new Position(loc.start.line - 1, loc.start.column),
        new Position(loc.end.line - 1, loc.end.column)
    );
}
