// 棋譜新規作成のコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';
import KifuApp from './kifuApp';

import BoardHeader from './header';
import BoardFooter from './footer';

export default class BoardCreate extends ComponentBasic {
    private header: BoardHeader = BoardHeader.sharedComponent;
    private editor: KifuApp = new KifuApp({}, SHOGI.MODE.CREATE);
    private footer: BoardFooter = new BoardFooter();

    constructor() {
        super();

        this.oninit = () => {
            // TODO: 未ログインをはじく処理
            // TODO: スクロールのリセット処理

            this.editor = new KifuApp({}, SHOGI.MODE.CREATE);
        }

        this.view = (vnode) => {
            return [
                m(this.header),
                m(this.editor),
                m(this.footer)
            ];
        }
    }
}