// 棋譜閲覧時のコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';
import KifuApp from './kifuApp';

import BoardHeader from './header';
import BoardFooter from './footer';

import BoardViewHeader from './viewerHeader';

export default class BoardView extends ComponentBasic {
    // 全体のヘッダー
    private header: BoardHeader = BoardHeader.sharedComponent;

    // ビューアーのヘッダー
    private viewHeader: BoardViewHeader = null;

    // 棋譜ビューアー
    private viewer: KifuApp = null;

    // ビューアーのフッター
    private footer: BoardFooter = new BoardFooter();

    private kifuID: string = '';

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            this.kifuID = vnode.attrs['id'];
            this.viewHeader = null;
            this.viewer = null;

            fbManager.kifuInfoLoad(this.kifuID).then((kifuInfo) => {
                this.viewHeader = new BoardViewHeader(this.kifuID, kifuInfo);
            });

            fbManager.kifuLoad(this.kifuID).then((json) => {
                this.viewer = new KifuApp(json, SHOGI.MODE.VIEW);
            });
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                (this.viewHeader) ?
                m(this.viewHeader) 
                :
                null,
                (this.viewer) ? 
                m(this.viewer) 
                :
                m('div', {class: c('c-kifu_loading')}, 'kifu loading...'),
                m(this.footer)
            ];
        };
    }
}