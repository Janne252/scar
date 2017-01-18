'use strict';

import * as vscode from 'vscode';
import {ILuaParseOptions, ILuaParseError, ILuaParseCallExpressionNode} from 'luaparse';
import {window, workspace, languages, TextDocument, DiagnosticCollection, Range, Position, TextEditor, commands, WorkspaceEdit, } from 'vscode';
import * as path from 'path';
import {ILuaFunctionDefinition} from './scar';
import LuaParser from './luaParser/luaParser';
import LuaParserCallExpression from './luaParser/callExpression';
import LuaParserDiagnostic from './diagnostic/LuaParserDiagnostic';
import DiagnosticProvider from './diagnosticProvider';
import SCARDocDecorationTypeApplier from './decorationType/scarDocDecorationTypeApplier';
import LuaConstsAutoDecorationTypeApplier from './decorationType/luaConstsAutoDecorationTypeApplier';
import LuaDocDecorationTypeApplier from './decorationType/luaDocDecorationTypeApplier';
import WorkspaceDecorationTypeApplier from './decorationType/workspaceDecorationTypeApplier';
import DecorationTypeApplierCollection from './decorationType/decorationTypeApplierCollection';

import CompletionItemProvider from './completionItemProvider';
import SignatureHelpProvider from './signatureHelpProvider';
import HoverProvider from './hoverProvider';
import {LuaDocHoverSource, SCARDocHoverSource} from './itemSources/luaDocHover';

import LuaWorkspaceParser from './luaWorkspaceParser/parser';
import {SCARDocParser, LuaDocParser, LuaConstsAutoParser, DumpJSON} from './scar';

import ItemSourceMerger from './itemSourceMerger/merger';
import {ICompletionItem} from './itemSources/completionItem';
import {ISignatureHelp} from './itemSources/signatureHelp';
import {IHover} from './itemSources/hover';
import {SCARDocCompletionItemSource, LuaDocCompletionItemSource} from './itemSources/luaDocCompletionItem';
import LuaConstsAutoCompletionItemSource from './itemSources/luaConstsAutoCompletionItem';
import DocumentCompletionItemSource from './itemSources/documentCompletionItem';
import WorkspaceCompletionItemSource from './itemSources/workspaceCompletionItem';
import {SCARDocSignatureHelpSource, LuaDocSignatureHelpSource} from './itemSources/luaDocSignatureHelp';
import QuickPickInsertCommand from './command/quickPickInsertCommand';
import LuaWorkspaceParserCollection from './luaWorkspaceParser/parserCollection';

const LUA_PARSER_OPTIONS: ILuaParseOptions  = {
    comments: true,
    locations: true,
    ranges: true
}

let diagnosticProvider: DiagnosticProvider;
let completionItemMerger = new ItemSourceMerger<ICompletionItem>();
let scarDocParser: SCARDocParser;
let luaDocParser: LuaDocParser;
let luaConstsAutoParser: LuaConstsAutoParser;
let documentCompletionItemSource: DocumentCompletionItemSource;

let decorationTypeAppliers = new DecorationTypeApplierCollection('scar');
let signatureHelpSourceMerger = new ItemSourceMerger<ISignatureHelp>();
let workspaceParser: LuaWorkspaceParser;
let additionalWorkspaces: LuaWorkspaceParserCollection = new LuaWorkspaceParserCollection();
let hoverMerger = new ItemSourceMerger<IHover>();

export function activate(context: vscode.ExtensionContext) 
{
    scarDocParser = new SCARDocParser(path.join(__dirname, '../../data/scardoc.json'));
    luaDocParser = new LuaDocParser(path.join(__dirname, '../../data/luadoc.json'));
    luaConstsAutoParser = new LuaConstsAutoParser(path.join(__dirname, '../../data/luaconstsauto.scar'));
    documentCompletionItemSource = new DocumentCompletionItemSource();
    documentCompletionItemSource.autoUpdater.start();
    
    diagnosticProvider = new DiagnosticProvider(new LuaParser(LUA_PARSER_OPTIONS), languages.createDiagnosticCollection());
    workspaceParser = new LuaWorkspaceParser(workspace.rootPath, diagnosticProvider.luaParser);

    context.subscriptions.push(commands.registerCommand('scar.reloadWorkspace', (args: any[]) =>
    {
        workspaceParser.reload().then(() => 
        {
            decorationTypeAppliers.update(window.activeTextEditor);
            console.log('Workspace reloaded!');
        });
    }));
    context.subscriptions.push(commands.registerCommand('scar.dumpAst', (args: any[]) =>
    {
        DumpJSON(diagnosticProvider.luaParser.ast);
    }));

    let config = workspace.getConfiguration('scar');

    let loadWorkspaces: string[] = <string[]>config.get('loadWorkspaces');
    loadWorkspaces.forEach(parser => additionalWorkspaces.add(new LuaWorkspaceParser(parser, diagnosticProvider.luaParser)));
    
    let parsers = [
        scarDocParser.load(),
        luaDocParser.load(),
        luaConstsAutoParser.load(),
        workspaceParser.load(),
        additionalWorkspaces.load(),
    ];

    Promise.all(parsers).then(() => 
    {
        console.log('All loaded!');

        function registerWorkspaceParser(newParser: LuaWorkspaceParser)
        {
            signatureHelpSourceMerger.addActiveSource(newParser.signatureHelpSource);
            completionItemMerger.addActiveSource(newParser.completionItemSource);
            hoverMerger.addActiveSource(newParser.hoverSource);
            decorationTypeAppliers.addApplier(new WorkspaceDecorationTypeApplier(newParser.completionItemSource, diagnosticProvider.luaParser));
        }

        decorationTypeAppliers.addApplier(new SCARDocDecorationTypeApplier(scarDocParser, diagnosticProvider.luaParser));
        decorationTypeAppliers.addApplier(new LuaConstsAutoDecorationTypeApplier(luaConstsAutoParser, diagnosticProvider.luaParser));
        decorationTypeAppliers.addApplier(new LuaDocDecorationTypeApplier(luaDocParser, diagnosticProvider.luaParser));

        completionItemMerger.addStaticSource(new SCARDocCompletionItemSource(scarDocParser));
        completionItemMerger.addStaticSource(new LuaDocCompletionItemSource(luaDocParser));
        completionItemMerger.addStaticSource(new LuaConstsAutoCompletionItemSource(luaConstsAutoParser));
        completionItemMerger.addActiveSource(documentCompletionItemSource);

        signatureHelpSourceMerger.addStaticSource(new SCARDocSignatureHelpSource(scarDocParser));
        signatureHelpSourceMerger.addStaticSource(new LuaDocSignatureHelpSource(luaDocParser));

        hoverMerger.addStaticSource(new LuaDocHoverSource(luaDocParser));
        hoverMerger.addStaticSource(new SCARDocHoverSource(scarDocParser));

        registerWorkspaceParser(workspaceParser);
        additionalWorkspaces.parsers.forEach(additionalParser => registerWorkspaceParser(additionalParser));

        context.subscriptions.push(vscode.languages.registerCompletionItemProvider('scar', new CompletionItemProvider(completionItemMerger)));
        context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('scar', new SignatureHelpProvider(signatureHelpSourceMerger, diagnosticProvider.luaParser), '('));
        context.subscriptions.push(vscode.languages.registerHoverProvider('scar', new HoverProvider(hoverMerger)));
 
        context.subscriptions.push(new QuickPickInsertCommand('scar.findBlueprint', luaConstsAutoParser.blueprints));

        workspace.onDidSaveTextDocument((textDocument: TextDocument) =>
        {
            documentCompletionItemSource.autoUpdater.shouldUpdate = true;

            workspaceParser.resolveWorkspaceFileChanged(textDocument.fileName).then((success) => 
            {
                if (success)
                {
                    decorationTypeAppliers.update(window.activeTextEditor);
                }
            });
        });

        workspace.onDidChangeTextDocument((documentChanged) => 
        {
            if (documentChanged.document.languageId == 'scar')
            {
                documentCompletionItemSource.autoUpdater.shouldUpdate = true;
                diagnosticProvider.update(documentChanged.document);
                decorationTypeAppliers.update(window.activeTextEditor);
            }
        });

        window.onDidChangeActiveTextEditor((textEditor) => 
        {
            if (textEditor.document.languageId == 'scar')
            {
                diagnosticProvider.update(textEditor.document);
                documentCompletionItemSource.autoUpdater.shouldUpdate = true;
                decorationTypeAppliers.update(textEditor);
            }
        });

        // Kick-off
        if (window.activeTextEditor !== undefined && window.activeTextEditor.document.languageId == 'scar')
        {
            diagnosticProvider.update(window.activeTextEditor.document);
            decorationTypeAppliers.update(window.activeTextEditor);
        } 
    });
}

export function deactivate() 
{
    
}