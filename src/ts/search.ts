// 棋譜検索時のコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

import BoardHeader from './header';
import BoardFooter from './footer';

export default class BoardSearch extends ComponentBasic {
    // 全体のヘッダー
    private header: BoardHeader = BoardHeader.sharedComponent;

    // ビューアーのフッター
    private footer: BoardFooter = new BoardFooter();

    private searchWord: string = '';

    constructor() {
        super();

        this.oninit = (vnode) => {
            this.searchWord = vnode.attrs['word'];
            console.log(this.searchWord);
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                m('section', {class: c('section')}, [
                    m('h5', {class: c('is-5')}, '検索文字列:' + this.searchWord),
                    m('div', {class: c('container')}, '棋譜検索は準備中です。')
                ]),
                m(this.footer)
            ];
        };
    }
}