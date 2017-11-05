// 投稿リストのコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as moment from 'moment';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

import BoardHeader from './header';
import BoardFooter from './footer';

export default class BoardPostList extends ComponentBasic {
    private header: BoardHeader = BoardHeader.sharedComponent;
    private footer: BoardFooter = new BoardFooter();
    private posts: Array<Object> = null;

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            this.posts = null;

            if(fbManager.user) {
                fbManager.userPosts().then((kifuData) => {
                    this.posts = kifuData;
                })
            }
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                m('section', {class: c('section')}, [
                    m('div', {class: c('container')}, [
                        m('h3', {class: c('title', 'is-3')}, '投稿棋譜一覧'),
                        m('table', {class: c('table', 'is-striped')}, [
                            m('thead', 
                                m('tr', 
                                    m('th', 'タイトル'),
                                    m('th', 'タイプ'),
                                    m('th', '更新日時'),
                                    m('th', 
                                        m('span', {class: c('icon')}, 
                                            m('i', {class: c('fa', 'fa-star')})
                                        )
                                    ),
                                    m('th', '操作')
                                )
                            ),
                            (this.posts) ?
                            m('tbody',
                                _.map(this.posts, (kifuInfo) => {
                                    return m('tr', [
                                        m('td', [
                                            m('a', {
                                                oncreate: m.route.link,
                                                href : '/view/' + kifuInfo['id']
                                            }, kifuInfo['info']['title'])
                                        ]),
                                        m('td', (kifuInfo['info']['type'] === SHOGI.LIST.KIFU) ? '棋譜' : '定跡'),
                                        m('td', moment.unix((kifuInfo['info']['updatedAt'] / 1000)).format('YYYY-MM-DD HH:mm')),
                                        m('td', kifuInfo['info']['star']),
                                        m('td', [
                                            m('span', {
                                                class: c('icon', 'c-kifu_editButton'),
                                                onclick: () => {
                                                    m.route.set('/edit/' + kifuInfo['id'])
                                                }
                                            },
                                                m('i', {class: c('fa', 'fa-pencil')})
                                            ),
                                            /*
                                            // 削除機能は現時点では無効にしておく
                                            m('span', {class: c('icon')},
                                                m('i', {class: c('fa', 'fa-trash')})
                                            )
                                            */
                                        ])
                                    ])
                                })
                            )
                            :
                            null,
                        ])
                    ])
                ]),
                m(this.footer)
            ];
        };
    }
}