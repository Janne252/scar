'use strict';

import {CompletionItem, CompletionItemKind, ParameterInformation} from 'vscode';
import {IItem} from '../itemSourceMerger/types';
import ActiveItemSource from '../itemSourceMerger/activeSource';
import {ISCARDoc, ILuaDoc, ILuaFunctionDefinition} from '../scar';
import {IWorkspaceSignatureHelp} from './signatureHelp';
import WorkspaceLuaFunctionInformation from '../luaWorkspaceParser/workspaceLuaFunctionInformation';
import {LuaDocSignatureHelpSource} from './luaDocSignatureHelp';

/**
 * Represents an active source of workspace SignatureHelp items.
 */
export default class WorkspaceSignatureHelpSource extends ActiveItemSource<IWorkspaceSignatureHelp>
{
    /**
     * Creates a new instance of WorkspaceSignatureHelpSource.
     */
    constructor()
    {
        super('workspaceSignatureHelpItems', []);
    }
    /**
     * Add a new item from the workspace parser.
     * @param info The info the workspace parser created.
     */
    public parserAddItem(info: WorkspaceLuaFunctionInformation): void
    {   
        let parameters = this.getParameters(info);

        this.addItem(<IWorkspaceSignatureHelp>{
            id: 'workspace_' + info.name,
            name: info.name,
            filepath: info.filepath,
            activeParameter: 0,
            activeSignature: 0,
            signatures: [
                {
                    label: info.signature,
                    documentation: info.description,
                    parameters: parameters
                }
            ],
            parameterCount: parameters.length,
            lastParameterIsList: false
        });
    }
    /**
     * Internally creates a parameter array of a parsed function.
     * @param info The parsed function information.
     */
    protected getParameters(info: WorkspaceLuaFunctionInformation): ParameterInformation[]
    {
        let result: ParameterInformation[] = [];
        
        for(let param of info.parameters)
        {
            result.push({
                label: param.name,
                documentation: param.description
            });
        }

        return result;
    }
}
