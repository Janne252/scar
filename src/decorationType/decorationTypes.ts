'use strict';

import {window} from 'vscode';

/**
 * DecorationType for SCARDOC functions.
 */
export const SCARDocFunctionDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#008000',
        
    },
    dark: {
        color: '#008000; font-weight: bold;'
    },
});
/**
 * DecorationType for SCARDOC Enums.
 */
export const SCARDocEnumDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#FF8C00',
        
    },
    dark: {
        color: '#FF8C00; font-weight: bold;'
    },
});
/**
 * DecorationType for LuaConstsAuto.scar blueprint entries.
 */
export const LuaConstsAutoBlueprintDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#FF0000',
        
    },
    dark: {
        color: '#FF0000; font-weight: bold;'
    },
});
/**
 * DecorationType for workspace functions.
 */
export const WorkspaceFunctionDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#c23aff',
        
    },
    dark: {
        color: '#7e3878; font-weight: bold;'
    },
});
/**
 * DecorationType for Lua standard library functions.
 */
export const LuaDocFunctionDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#00CED1',
        
    },
    dark: {
        color: '#00CED1; font-weight: bold;'
    },
});
/**
 * DecorationType for Lua standard library enums.
 */
export const LuaDocEnumDecorationType = window.createTextEditorDecorationType({
    light: {
        color: '#00CED1',
        
    },
    dark: {
        color: '#00CED1; font-weight: bold;'
    },
});