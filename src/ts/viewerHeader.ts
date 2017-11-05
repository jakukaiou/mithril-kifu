// 棋譜ビューページのタイトル部分
import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as moment from 'moment';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import FirebaseManager from './firebaseManager';

export default class BoardViewHeader extends ComponentBasic {

    private title: string = '棋譜タイトル';
    private contributor: string = '投稿者';
    private star: number = 0;
    private createdAt: string = 'yyyy/mm/dd hh:MM';
    private updatedAt: string = 'yyyy/mm/dd hh:MM';
    private description: string = '説明文が入ります。';

    private starred : boolean;

    // スターを押した場合の処理を行う準備ができているかどうか
    private readyStar: boolean;

    constructor(kifuID: string, kifuInfo :Object) {
        super();

        const fbManager = FirebaseManager.sharedManager;

        this.oninit = (vnode) => {
            this.title = kifuInfo['title'];
            this.contributor = kifuInfo['contributor'];
            this.star = kifuInfo['star'];
            this.createdAt = moment.unix((kifuInfo['createdAt'] / 1000)).format('YYYY-MM-DD HH:mm');
            this.updatedAt = moment.unix((kifuInfo['updatedAt'] / 1000)).format('YYYY-MM-DD HH:mm');
            this.description = kifuInfo['description'];

            this.starred = false;
            this.readyStar = false;

            if(fbManager.user) {
            fbManager.userStarred(kifuID).then((starred) => {
                this.starred= starred;
                this.readyStar = true;
                m.redraw();
            });
            }else {
                this.readyStar = true;
            }
        };

        this.view = (vnode) => {
            return [
                m('section', {class: c('hero', 'is-info')}, 
                    m('div', {class: c('c-kifu_hero', 'hero-body', 'columns')}, [
                        m('div', {class: c('container', 'column')}, [
                            m('h1', {class: c('title')}, this.title),
                            m('h5', {class: c('is-5', 'subtitle')}, 'by ' + this.contributor),
                            m('h6', {class: c('is-6')}, '投稿: ' + this.createdAt),
                            m('h6', {class: c('is-6')}, '最終更新: ' + this.updatedAt),
                            m('div', {class: c('tags', 'c-kifu_hero_star_base', 'has-addons')}, [
                                m('span', {
                                    class: c('tag', 'c-kifu_hero_star', (this.starred) ? 'is-active' : null),
                                    onclick: () => {
                                        if(this.readyStar && fbManager.user) {
                                            if(!this.starred) {
                                                fbManager.kifuStar(kifuID).then((starCount) => {
                                                    this.starred = true;
                                                    this.star = starCount;
                                                    m.redraw();
                                                })
                                            }else {
                                                fbManager.kifuUnstar(kifuID).then((starCount) => {
                                                    this.starred = false;
                                                    this.star = starCount;
                                                    m.redraw();
                                                })
                                            }
                                        }
                                    }
                                }, [
                                    m('span', 
                                    (this.readyStar) ?
                                        (this.starred) ?  
                                            'Unstar' 
                                            :
                                            'Star'
                                        :
                                        'loading...'
                                    ),
                                    m('span', {class: c('icon')}, [
                                        m('i', {class: c('fa', 'fa-star')})
                                    ])
                                ]),
                                m('span', {class: c('tag')}, 
                                (this.readyStar) ?
                                    this.star.toString()
                                    :
                                    '0',
                                )
                            ]),
                            
                        ]),
                        /*
                        m('div', {class: c('column')}, this.description)
                        */
                    ])
                )
            ];
        };
    }
}