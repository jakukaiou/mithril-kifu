import * as m from 'mithril';
import * as c from 'classnames';

import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

export default class BoardHeader extends ComponentBasic {

    // TODO: 初回時もログイン

    // シングルトンにするためのインスタンス
    private static _sharedComponent: BoardHeader;

    private isLogin: Boolean;

    private userdata: Object;

    private searchWord: string;

    constructor() {
        super();

        // ログイン完了していて、かつデータベースにも登録済みの場合にtrueにする
        this.isLogin = false;

        this.userdata = null;

        this.searchWord = '';

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = () => {            
            if(fbManager.user) {
                fbManager.isRegister().then(
                    (user) => {
                        if(user) {
                            this.isLogin = true;
                            fbManager.userdata().then((userdata) => {
                                this.userdata = userdata;
                                m.redraw();
                            });
                        }
                    }
                )
            }
        }

        this.view = (vnode) => {
            return [
                m('section', { 
                    class: c('hero', 'is-large', 'c-header_base'),
                },
                    // ヘッダーロゴ
                    m('div', { class: c('hero-head') },
                        m('nav', { class: c('navbar') },
                            m('div', { class: c('container') }, [
                                m('div', { class: c('navbar-brand') }, [
                                    m('a', {
                                        class: c('navbar-item'),
                                        onclick: () => {
                                            m.route.set('/')
                                        }
                                    }, 'Board'),
                                    m('span', { class: c('navbar-burger', 'burger', 'c-header_burger') }, [
                                        m('span'),
                                        m('span'),
                                        m('span')
                                    ])
                                ]),
                                // ヘッダーメニュー
                                m('div', { class: c('navbar-menu') },
                                    m('div', { class: c('navbar-end') }, [

                                        // 検索フォーム
                                        m('span', { class: c('navbar-item') }, [
                                            m('div', { class: c('field', 'has-addons') }, [
                                                m('div', { class: c('control') },
                                                    m('input', {
                                                        class: c('input'),
                                                        type: 'text',
                                                        placeholder: '棋譜を検索',
                                                        value: this.searchWord,
                                                        oninput: m.withAttr('value', (value) => {
                                                            this.searchWord = value;
                                                        })
                                                    })
                                                ),
                                                m('div', { class: c('control') },
                                                    m('a', { 
                                                        class: c('button'),
                                                        onclick: () => {
                                                            m.route.set('/search/' + this.searchWord);
                                                        }
                                                    }, [
                                                        m('span', { class: c('icon') }, [
                                                            m('i', { class: c('fa', 'fa-lg', 'fa-search') })
                                                        ])
                                                    ])
                                                ),
                                            ])
                                        ]),

                                        // 設定アイコン
                                        (this.isLogin && this.userdata) ?
                                        [
                                            /*
                                            // 設定メニューは現時点では不要
                                            m('div', { class: c('dropdown', 'is-hoverable') }, [
                                                m('a', { class: c('navbar-item') }, [
                                                    m('span', { class: c('icon') }, [
                                                        m('i', { class: c('fa', 'fa-lg', 'fa-cog') })
                                                    ])
                                                ]),
                                                m('div', { class: c('dropdown-menu'), role: 'menu' }, [
                                                    m('div', { class: c('dropdown-content') }, [ 
                                                        m('a', { class: c('dropdown-item'), href: '#' }, 'お気に入りタグ'),
                                                        m('a', { class: c('dropdown-item'), href: '#' }, 'アカウント削除'),
                                                    ])
                                                ])
                                            ]),
                                            */

                                            // ユーザーメニューアイコン
                                            m('div', { class: c('c-header_user', 'dropdown', 'is-hoverable') }, [
                                                m('a', { class: c('navbar-item') }, [
                                                    m('span', { class: c('icon') }, [
                                                        m('i', { class: c('fa', 'fa-lg', 'fa-user-circle') })
                                                    ]),
                                                    m('span', { class: c('c-header_user_name') }, this.userdata['name'])
                                                ]),
                                                m('div', { class: c('dropdown-menu'), role: 'menu' }, [
                                                    m('div', { class: c('dropdown-content') }, [
                                                        m('a', { 
                                                            class: c('dropdown-item'),
                                                            onclick: () => {
                                                                m.route.set('/posts', {key: Date.now()});
                                                            }
                                                    }, '投稿一覧'),
                                                        m('a', { 
                                                            class: c('dropdown-item'),
                                                            onclick: () => {
                                                                m.route.set('/stars', {key: Date.now()});
                                                            }
                                                        }, 'お気に入り'),
                                                        m('a', {
                                                            class: c('dropdown-item'),
                                                            onclick: () => {
                                                                // ログアウト処理
                                                                fbManager.logout().then(() => {
                                                                    this.isLogin = false;
                                                                    this.userdata = null;
                                                                    m.redraw();
                                                                });
                                                            }
                                                        }, 'ログアウト'),
                                                        m('hr', { class: c('dropdown-divider') }),
                                                        /*
                                                        m('div', { class: c('dropdown-item') }, [
                                                            m('p', [
                                                                m('strong', 'Login Type:'),
                                                                m('span', { class: c('icon') }, [
                                                                    m('i', { class: c('fa', 'fa-lg', 'fa-' + this.userdata['provider']) })
                                                                ])
                                                            ])
                                                        ]),
                                                        m('hr', { class: c('dropdown-divider') }),
                                                        */
                                                        m('div', { class: c('dropdown-item') }, [
                                                            m('p', [
                                                                m('strong', '投稿数:'),
                                                                m('span', this.userdata['posts'])
                                                            ]),
                                                            m('p', [
                                                                m('strong', 'Star:'),
                                                                m('span', this.userdata['stars'])
                                                            ])
                                                        ]),
                                                    ])
                                                ])
                                            ])
                                        ]
                                        :
                                        null
                                        ,
                                        (this.isLogin && this.userdata) ?
                                        // 投稿ボタン
                                        m('span', { class: c('navbar-item') }, [
                                            m('a', { 
                                                class: c('button', 'is-inverted'),
                                                onclick: () => {
                                                    m.route.set('/create', {key: Date.now()});
                                                },
                                            }, [
                                                m('span', { class: c('icon') }, [
                                                    m('i', { class: c('fa', 'fa-lg', 'fa-file') })
                                                ]),
                                                m('span', '投稿')
                                            ])
                                        ])
                                        :
                                        // ログインボタン
                                        m('div', { class: c('c-header_user', 'dropdown', 'is-right', 'is-hoverable') }, [
                                            m('span', { class: c('navbar-item') }, [
                                                m('a', { 
                                                    class: c('button', 'is-inverted'),
                                                }, [
                                                    m('span', { class: c('icon') }, [
                                                        m('i', { class: c('fa', 'fa-lg', 'fa-sign-in') })
                                                    ]),
                                                    m('span', 'ログイン')
                                                ])
                                            ]),
                                            m('div', { class: c('dropdown-menu'), role: 'menu' }, [
                                                m('div', { class: c('dropdown-content') }, [
                                                    m('a', { 
                                                        class: c('dropdown-item'),
                                                        onclick: () => {
                                                            fbManager.googleLogin(() => {
                                                                fbManager.isRegister().then((isRegister) => {
                                                                    if(isRegister) {
                                                                        // 画面の更新
                                                                        this.isLogin = true;
                                                                        fbManager.userdata().then((userdata) => {
                                                                            m.redraw();
                                                                            this.userdata = userdata;
                                                                        });
                                                                    }else {
                                                                        this.userdata = null;
                                                                        m.route.set('/init');
                                                                    }
                                                                });
                                                            })
                                                        }
                                                    }, [
                                                        m('span', { class: c('icon') }, [
                                                            m('i', { class: c('fa', 'fa-lg', 'fa-google') })
                                                        ]),
                                                        m('span', 'googleでログイン')
                                                    ]),
                                                    m('a', { 
                                                        class: c('dropdown-item'),
                                                        onclick: () => {
                                                            fbManager.twitterLogin(() => {
                                                                fbManager.isRegister().then((isRegister) => {
                                                                    if(isRegister) {
                                                                        // 画面の更新
                                                                        this.isLogin = true;
                                                                        fbManager.userdata().then((userdata) => {
                                                                            m.redraw();
                                                                            this.userdata = userdata;
                                                                        });
                                                                        
                                                                    }else {
                                                                        this.userdata = null;
                                                                        m.route.set('/init');
                                                                    }
                                                                });
                                                            })
                                                        }
                                                    }, [
                                                        m('span', { class: c('icon') }, [
                                                            m('i', { class: c('fa', 'fa-lg', 'fa-twitter') })
                                                        ]),
                                                        m('span', 'twitterでログイン')
                                                    ])
                                                ])
                                            ])
                                        ])
                                    ])
                                )
                            ]),
                        )
                    ),
                ),
                m('div', {class: c('c-header_padding')})
            ]
        }
    }

    // 単一のコンポーネントを返す
    public static get sharedComponent(): BoardHeader {
        if (!this._sharedComponent) {
            this._sharedComponent = new BoardHeader();
        }

        return this._sharedComponent;
    }
}