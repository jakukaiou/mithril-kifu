// トップページのコンポーネント
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

import BoardHeader from './header';

export default class UserInit extends ComponentBasic {
    private header: BoardHeader = BoardHeader.sharedComponent;
    private username: string = 'username';

    // 入力中のユーザー名が有効かどうか
    private valid: boolean = true;

    // ユーザー名の長さが上限内かどうか
    private within: boolean = true;

    // ロード中かどうか
    private loading: boolean = false;

    // TODO: ユーザー名重複対応
    // TODO: 文字数制限
    // TODO: 未ログイン、データベース登録済ならアクセスをはじく

    constructor() {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.view = (vnode) => {
            return [
                m(this.header),
                m('section', {class: c('section')}, [
                    m('div', {class: c('container')}, [
                        m('h3', {class: c('title', 'is-3')}, '初期設定'),
                        m('div', {class: c('c-config_group')}, [
                            m('div', {class: c('field')}, [
                                m('label', {class: c('label')}, 'Username'),
                                m('p', {class: c('help')}, '投稿者名として利用される文字列です。'),
                                m('div', {class: c('control', 'has-icons-left', 'has-icons-right')}, [
                                    m('input', {
                                        class: c('input', (this.valid && this.within) ? 'is-success' : 'is-danger'),
                                        type: 'text',
                                        placeholder: 'input username',
                                        value: this.username,
                                        oninput: m.withAttr('value', (value) => {
                                            this.username = value;

                                            // バリデーション
                                            this.valid = this.username.match(/^[\w-_]+$/) ? true : false;

                                            // 文字数チェック
                                            this.within = (this.username.length < 21) ? true : false;
                                        })
                                    }),
                                    m('span', {class: c('icon', 'is-small', 'is-left')}, [
                                        m('i', {class: c('fa', 'fa-user')})
                                    ])
                                ]),
                                (this.within) ?
                                null
                                :
                                m('p', {class: c('help', 'is-danger')}, 'ユーザー名は半角20文字以下にして下さい！'),
                                (this.valid) ?
                                m('p', {class: c('help', 'is-success')}, '数字,アルファベットと-(ハイフン), _(アンダースコア)が使用できます。')
                                :
                                (!this.username) ?
                                    m('p', {class: c('help', 'is-danger')}, 'ユーザー名が空です！')
                                    :
                                    m('p', {class: c('help', 'is-danger')}, '数字,アルファベットと-(ハイフン), _(アンダースコア)以外の文字が使用されています！')
                            ]),

                            m('div', {class: c('control')}, 
                                m('button', {
                                    class: c('button', 'is-primary', (this.loading) ? 'is-loading' : null),
                                    disabled: (this.valid && this.within) ? false : true,
                                    onclick: () => {
                                        if(this.valid) {
                                            this.loading = true;

                                            fbManager.register(this.username)
                                            .then(() => {
                                                m.route.set('/');
                                                m.redraw();
                                            });
                                        }
                                    }
                                }, 'ユーザー登録')
                            )
                        ])
                    ])
                ])
            ];
        }
    }
}