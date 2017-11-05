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

export default class BoardEdit extends ComponentBasic {
    // 全体のヘッダー
    private header: BoardHeader = BoardHeader.sharedComponent;

    // 棋譜エディタ
    private editor: KifuApp = null;

    // ビューアーのフッター
    private footer: BoardFooter = new BoardFooter();

    private kifuID: string = 'kifuID';

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            this.kifuID = vnode.attrs['id'];

            // ここで投稿者自身の棋譜でない場合はトップへ遷移させる
            if(fbManager.user) {
                fbManager.isOwn(this.kifuID).then((isOwn) => {
                    if(isOwn) {
                        fbManager.kifuLoad(this.kifuID).then((json) => {
                            this.editor = new KifuApp(json, SHOGI.MODE.EDIT, this.kifuID);
                        })
                    }else {
                        // 持ち主が自分でないならトップへ遷移
                        m.route.set('/');
                    }
                })
            }else {
                // トップへ遷移
                m.route.set('/');
            }
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                (this.editor) ? 
                m(this.editor) 
                :
                m('div', {class: c('c-kifu_loading')}, 'kifu loading...'),
                m(this.footer)
            ];
        }
    }
}