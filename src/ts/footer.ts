import * as m from 'mithril';
import * as c from 'classnames';

import ComponentBasic from './componentbasic';

export default class BoardFooter extends ComponentBasic {
    constructor() {
        super();

        this.view = (vnode) => {
            return [
                m('footer', {class: c('footer', 'c-footer_base')}, [
                    m('div', {class: c('container')}, [
                        m('div', {class: c('content', 'has-text-centered')}, [
                            m('p', '2018 board')
                        ])
                    ])
                ])
            ]
        }
    }
}