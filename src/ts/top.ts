// トップページのコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

import BoardHeader from './header';
import BoardFooter from './footer';

export default class BoardTop extends ComponentBasic {
    private infoClose: Boolean = false;
    private header: BoardHeader = BoardHeader.sharedComponent;
    private footer: BoardFooter = new BoardFooter();

    /*
    private latestArticles = {
        'id1': {
            title: 'パックマン戦法',
            type: SHOGI.LIST.JOSEKI,
            description: '恐怖のパックマン',
            tags: ['奇襲戦法', 'パックマン'],
            star: 55,
            contributor: 'taro_from_momo'
        },
        'id2': {
            title: '右四間穴熊',
            type: SHOGI.LIST.JOSEKI,
            description: 'some description',
            tags: ['居飛車', '右四間飛車', '穴熊囲い'],
            star: 175,
            contributor: 'migishiken_man'
        },
        'id3': {
            title: '第30回竜王戦7番勝負',
            type: SHOGI.LIST.KIFU,
            description: '第一局の対戦です。',
            tags: ['居飛車', '相居飛車'],
            star: 555,
            contributor: 'mr-MonteCarlo'
        },
        'id4': {
            title: '第30回竜王戦7番勝負',
            type: SHOGI.LIST.KIFU,
            description: '第一局の対戦です。',
            tags: ['居飛車', '相居飛車'],
            star: 555,
            contributor: 'mr-MonteCarlo'
        },
    };
    */

    private latestArticles = null;

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            fbManager.latestKifuListLoad(6).then((kifus) => {
                this.latestArticles = kifus;

                m.redraw();
            });
        };

        this.view = (vnode) => {
            return [
                m(this.header),
                
                m('section', {class: c('section')}, [
                    m('div', {class: c('container', 'level')}, [
                        m('div', {class: c('level-left')}, [
                            // サービス名
                            m('h1', {class: c('title', 'is-1')}, 'Board')
                        ]),
                        m('div', {class: c('level-right')}, 
                            m('div', {class: c('c-adArea')}, '728×90 banner')
                        )
                    ]),

                    m('div', {class: c('container')}, [
                        // お知らせがある場合はここに書く
                        /*
                        m('article', {class: c('c-kifu_info', 'message', 'is-info', (this.infoClose) ? 'is-close' : null)}, [
                            m('div', {class: c('message-header')}, [
                                m('p', 'お知らせタイトル'),
                                m('button', {
                                    class: c('delete'),
                                    'aria-label': 'delete',
                                    onclick: () => {
                                        this.infoClose = true;
                                    }
                                })
                            ]),
                            m('div', {class: c('message-body')}, 'お知らせ内容')
                        ]),
                        */

                        m('div', {class: c('tile', 'is-parent', 'is-vertical')}, [
                            m('article', {class: c('tile', 'is-child', 'notification', 'is-primary')}, [
                                m('h4', {class: c('title', 'is-4')}, '最新6件'),

                                /*
                                m('div', {class: c('tabs')}, [
                                    m('ul', [
                                        m('li', {class: c('is-active')}, 
                                            m('a', '週間')
                                        ),
                                        m('li', {class: c()}, 
                                            m('a', '総合')
                                        )
                                    ])
                                ]),
                                */

                                (this.latestArticles) ?
                                _.map(SHOGI.Util.objChunk(this.latestArticles, 3), (articles, arrNum) => {
                                    if(_.size(articles) < 3){
                                        while(_.size(articles) < 3) {
                                            articles['$$$' + _.size(articles)] = null;
                                        }
                                    }

                                    let count = 0;

                                    return m('div', {class: c('columns')}, [

                                        _.map(articles, (article, key) => {
                                            
                                            count ++;

                                            return m('div', {class: c('column')}, [
                                                (!_.isNull(article)) ?
                                                [
                                                    m('strong', arrNum * 3 + count),
                                                    m('div', {class: c('c-kifu_box card')}, [
                                                        m('header', {class: c('card-header', 'c-kifu_box_header')}, [
                                                            m('a', {class: c('card-header-title', 'c-kifu_box_title'), oncreate: m.route.link, href : '/view/' + key}, article['title']),
                                                            m('div', {class: c('level-right', 'c-kifu_box_type')}, (article['type'] === SHOGI.LIST.KIFU) ? '棋譜' : '定跡' ),
                                                        ]),
                                                        m('div', {class: c('card-content', 'c-kifu_box_description')}, 
                                                            m('div', {class: c('content')}, article['description'])
                                                        ),

                                                        /*
                                                        m('div', {class: c('c-kifu_box_tags')}, [
                                                            _.map(article.tags, (tag) => {
                                                                return m('span', {class: c('tag', 'is-info')}, tag)
                                                            })
                                                        ]),
                                                        */

                                                        m('div', {class: c('c-kifu_box_footer')}, [
                                                            m('div', {class: c('c-kifu_box_star')}, [
                                                                m('span', { class: c('icon') }, [
                                                                    m('i', { class: c('fa', 'fa-star') })
                                                                ]),
                                                                m('span', article['star'])
                                                            ]),
                                                            m('div', {class: c('c-kifu_box_contributor')}, [
                                                                'by ',
                                                                m('strong', article['contributor'])
                                                            ])
                                                        ])
                                                    ])
                                                ]
                                                :
                                                null
                                            ]);
                                        })
                                    ]);
                                })
                                :
                                null
                            ])
                        ])
                    ])
                ]),

                m(this.footer)
            ];
        }
    }
}