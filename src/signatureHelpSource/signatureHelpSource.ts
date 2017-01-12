'use strict';

import {SignatureHelp, SignatureInformation} from 'vscode';

export interface ISignatureHelpSource
{
    isReady: boolean;
    getSignatureHelpItems(): SignatureHelp[];
    load(): Thenable<void>;
}

export interface IStaticSignatureHelpSource extends ISignatureHelpSource
{
    
}

export interface IActiveSignatureHelpSource extends IStaticSignatureHelpSource
{
    updateSignatureHelpItems(items: SignatureHelp[]): void;
}

export interface ISignatureHelpSourceMerger
{
    addStaticSource(source: IStaticSignatureHelpSource): Thenable<void>;
    removeStaticSource(source: IStaticSignatureHelpSource): void;
    addActiveSource(source: IActiveSignatureHelpSource): Thenable<void>;
    removeActiveSource(source: IActiveSignatureHelpSource): void;

    activeSourceUpdated(source: IActiveSignatureHelpSource): void;

    getSignatureHelp(name: string): SignatureHelp;
}

