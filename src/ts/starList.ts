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

export default class BoardStarList extends ComponentBasic {
    private header: BoardHeader = BoardHeader.sharedComponent;
    private footer: BoardFooter = new BoardFooter();
    private stars: Array<Object> = null;

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            this.stars = null;

            if(fbManager.user) {
                fbManager.userStars().then((kifuData) => {
                    this.stars = kifuData;
                })
            }
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                m('section', {class: c('section')}, [
                    m('div', {class: c('container')}, [
                        m('h3', {class: c('title', 'is-3')}, 'お気に入り棋譜一覧'),
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
                                    )
                                )
                            ),
                            (this.stars) ?
                            m('tbody',
                                _.map(this.stars, (kifuInfo) => {
                                    return m('tr', [
                                        m('td', [
                                            m('a', {
                                                oncreate: m.route.link,
                                                href : '/view/' + kifuInfo['id']
                                            }, kifuInfo['info']['title'])
                                        ]),
                                        m('td', (kifuInfo['info']['type'] === SHOGI.LIST.KIFU) ? '棋譜' : '定跡'),
                                        m('td', moment.unix((kifuInfo['info']['updatedAt'] / 1000)).format('YYYY-MM-DD HH:mm')),
                                        m('td', kifuInfo['info']['star'])
                                    ])
                                })
                            )
                            :
                            null
                        ])
                    ])
                ]),
                m(this.footer)
            ];
        };
    }
}