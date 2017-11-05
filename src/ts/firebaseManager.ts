import * as m from 'mithril';
import * as _ from 'lodash';
import * as SHOGI from './shogi';
import * as firebase from 'firebase';

import CONFIG from './fbconfig';

// jkf棋譜ファイルのアップロード処理を定義
// 最新の棋譜のID＋1をファイル名とする？

export default class FirebaseManager {
    private fire: firebase.app.App;

    // ユーザー認証処理
    private auth: firebase.auth.Auth;

    // 各種ユーザー情報・棋譜情報等の格納
    private database: firebase.database.Database;

    // json棋譜ファイルのアップロード・ダウンロード
    private storage: firebase.storage.Storage;

    // ユーザー名 あとで構造を変える
    private username: string;

    // シングルトンにするためのインスタンス
    private static _sharedManager: FirebaseManager;

    constructor() {
        this.fire = this.init();
        this.auth = firebase.auth(this.fire);
        this.database = firebase.database(this.fire);
        this.storage = firebase.storage(this.fire);

        this.username = 'user';
    }

    // 単一のインスタンスを返す
    public static get sharedManager (): FirebaseManager {
        if(!this._sharedManager) {
            this._sharedManager = new FirebaseManager();
        }

        return this._sharedManager;
    }

    // ログインしているかどうか
    public get isLogin() {
        if(_.isNull(this.auth.currentUser)) {
            return false;
        }else {
            return true;
        }
    }

    // ユーザーの情報を返す
    public get user() {
        if(_.isNull(this.auth.currentUser)) {
            return null;
        }else {
            return this.auth.currentUser;
        }
    }

    public userdata() {
        return this.isRegister().then((userdata) => {
            if(_.isNull(this.auth.currentUser)) {
                return null;
            }else {
                /*
                const providerId = this.auth.currentUser.providerData[0].providerId;
                let provider = 'question';

                if(providerId.match(/twitter/)) {
                    provider = 'twitter';
                }else if(providerId.match(/google/)) {
                    provider = 'google';
                }
                */

                this.username = userdata['username'];

                return {
                    userInfo: this.auth.currentUser,
                    name: userdata['username'],
                    posts: userdata['posts'],
                    stars: userdata['stars'],
                    //provider: provider
                };
            }
        })
    }

    // ユーザー名を登録する
    public register(username: string):Promise<any> {
        const uid = (this.auth.currentUser) ? this.auth.currentUser.uid : null;

        if(_.isNull(uid)) {
            throw Error('username登録の前にログインが完了していません。');
        }

        var newUserRef = this.database.ref('/users/' + uid);

        return newUserRef.set({
            username: username,
            stars: 0,
            posts: 0,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // ユーザー情報がdatabaseに登録されているかを返す
    public isRegister():Promise<any> {
        const uid = (this.auth.currentUser) ? this.auth.currentUser.uid : null;

        if(_.isNull(uid)) {
            //throw new Error('登録照合の前にログインする必要があります。');
            return Promise.resolve(false);
        }

        return this.database.ref('/users/' + uid).once('value').then((snapshot) =>{
            if(!_.isNull(snapshot.val())) {
                // ユーザーが登録済
                return Promise.resolve(snapshot.val());
            }else {
                // ユーザー情報が未登録
                return Promise.resolve(false);
            }
        });
    }

    // googleアカウントによるログイン処理
    public googleLogin(successProcess: () => void = null, failedProcess: () => void = null) {
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        this.auth.onAuthStateChanged((user) => {
            // ログイン後処理の実行
            if(user && successProcess){
                successProcess();
            }
        });

        if(!this.auth.currentUser) {
            this.auth.signInWithPopup(googleProvider).then(function(result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                let token = result.credential.accessToken;
                // The signed-in user info.
                let user = result.user;
                
                console.log('oh success login', this.auth.currentUser);
            }).catch(function(error) {
                // Handle Errors here.
                let errorCode = error.code;
                let errorMessage = error.message;
                // The email of the user's account used.
                let email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                let credential = error.credential;

                if(failedProcess) {
                    failedProcess();
                }
            });
        }else {
            if(successProcess){
                successProcess();
            }
        }
    }

    // twitterによるログイン処理
    public twitterLogin(successProcess: () => void = null, failedProcess: () => void = null) {
        const twitterProvider = new firebase.auth.TwitterAuthProvider();

        this.auth.onAuthStateChanged((user) => {
            // ログイン後処理の実行
            if(user && successProcess){
                successProcess();
            }
        });

        if(!this.auth.currentUser) {
            this.auth.signInWithPopup(twitterProvider).then(function(result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                let token = result.credential.accessToken;
                // The signed-in user info.
                let user = result.user;
                
                console.log('oh success login', this.auth.currentUser);
            }).catch(function(error) {
                // Handle Errors here.
                let errorCode = error.code;
                let errorMessage = error.message;
                // The email of the user's account used.
                let email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                let credential = error.credential;

                if(failedProcess) {
                    failedProcess();
                }
            });
        }else {
            if(successProcess){
                successProcess();
            }
        }
    }

    // ログアウト処理
    public logout() {
        return this.auth.signOut();
    }

    // 今のユーザーが与えられた棋譜の持ち主かどうか
    public isOwn(kifuID: string):Promise<boolean> {
        const userPostsRef = this.database.ref('/user_posts/' + this.auth.currentUser.uid);

        return userPostsRef.child(kifuID).once('value').then((snapshot) => {
            if(snapshot.val()) {
                return true;
            }else {
                return false;
            }
        });
    }

    // ユーザーの投稿棋譜一覧を取得
    public userPosts() {
        const userPostsRef = this.database.ref('/user_posts/' + this.auth.currentUser.uid);

        return userPostsRef.once('value').then((snapshot) => {
            const kifuIDs: Object = _.pickBy(snapshot.val(), (bool) => {
                return bool;
            });

            // 棋譜IDの一覧を返す
            return kifuIDs;
        }).then((kifuIDs: Array<Object>) => {
            // 各棋譜IDの棋譜情報を返す
            return Promise.all(
                _.map(kifuIDs, (bool: boolean, kifuID: string) => {
                    const kifuInfoRef = this.database.ref('/kifu/' + kifuID);
    
                    return this.kifuInfoLoad(kifuID).then(
                        (kifuInfo: Object) => {
                            return {info: kifuInfo, id: kifuID};
                        }
                    );
                })
            )
        });
    }

    //　ユーザーがスターした棋譜の一覧を取得
    public userStars() {
        const userStarsRef = this.database.ref('/user_favorites/' + this.auth.currentUser.uid);

        return userStarsRef.once('value').then((snapshot) => {
            const kifuIDs: Object = _.pickBy(snapshot.val(), (bool) => {
                return bool;
            });

            // 棋譜IDの一覧を返す
            return kifuIDs;
        }).then((kifuIDs: Array<Object>) => {
            // 各棋譜IDの棋譜情報を返す
            return Promise.all(
                _.map(kifuIDs, (bool: boolean, kifuID: string) => {
                    const kifuInfoRef = this.database.ref('/kifu/' + kifuID);
    
                    return this.kifuInfoLoad(kifuID).then(
                        (kifuInfo: Object) => {
                            return {info: kifuInfo, id: kifuID};
                        }
                    );
                })
            )
        });
    }

    // ユーザーがその棋譜をスターしているかどうかを取得
    public userStarred(kifuId: string): Promise<boolean> {
        const starRef = this.database.ref('/user_favorites/' + this.auth.currentUser.uid + '/' + kifuId);

        return starRef.once('value').then((snapshot) => {
            return snapshot.val();
        });
    }

    // 棋譜をスターし、最終的なスターカウントを返す
    public kifuStar(kifuId: string):Promise<number> {
        const uid = (this.auth.currentUser) ? this.auth.currentUser.uid : null;

        if(!uid) {
            return new Promise(() => {
                return false
            });
        }

        const userStarRef = this.database.ref('/user_favorites/' + this.auth.currentUser.uid + '/' + kifuId);
        const kifuStarRef = this.database.ref('/kifu/' + kifuId + '/star');

        let starCount = 0;

        return Promise.all([
            // user_favorites/にスター登録情報を登録する処理
            userStarRef.set(true),
            
            // /kifuのスター増加処理
            kifuStarRef.once('value').then((snapshot) => {
                return Promise.resolve(snapshot.val());
            }).then((star) => {
                starCount = ++star;
                return kifuStarRef.set(starCount);
            })
        ]).then(() => {
            return starCount;
        });
    }

    // 棋譜をアンスターし、最終的なスターカウントを返す
    public kifuUnstar(kifuId: string):Promise<number> {
        const uid = (this.auth.currentUser) ? this.auth.currentUser.uid : null;
        
        if(!uid) {
            return new Promise(() => {
                return false
            });
        }

        const userStarRef = this.database.ref('/user_favorites/' + this.auth.currentUser.uid + '/' + kifuId);
        const kifuStarRef = this.database.ref('/kifu/' + kifuId + '/star');

        let starCount = 0;

        return Promise.all([
            // user_favorites/にスター登録情報を登録する処理
            userStarRef.set(false),
            
            // /kifuのスター増加処理
            kifuStarRef.once('value').then((snapshot) => {
                return Promise.resolve(snapshot.val());
            }).then((star) => {
                starCount = --star;
                return kifuStarRef.set(starCount);
            })
        ]).then(() => {
            return starCount;
        });
    }

    // idで指定された棋譜情報をデータベースから取得する
    public kifuInfoLoad(id: string):Promise<Object> {
        const kifuRef = this.database.ref('/kifu/' + id);

        return kifuRef.once('value').then((snapshot) => {
            return snapshot.val();
        });
    }

    // 最新の棋譜リストを取得する
    public latestKifuListLoad(number : number):Promise<Object> {
        // /kifuへの参照
        const kifuRef = this.database.ref('/kifu/');

        return kifuRef.orderByChild('updatedAt').limitToFirst(number).once('value').then((snapshot) => {
            return snapshot.val();
        });
    }

    // 棋譜をロードし、そのjsonをobjectとして返す
    public kifuLoad(id: string):Promise<Object> {
        const rootRef = this.storage.ref();
        const downloadRef = rootRef.child(id + '.json');

        let json:Promise<object> = downloadRef.getDownloadURL().then((url)=>{

            return m.request({
                url: url
            }).then((json: object) => {
                return json;
            });
        });

        return json;
    }

    // 棋譜をセーブする
    public kifuSave(jkfData: Object, kifuID: string = null) {
        // TODO: descriptionデータの保存
        /**
         * 棋譜保存フロー
         * 1. クライアントサイドで一意なIDを発行
         * 2. 発行されたIDで棋譜情報をDBに保存
         * 3. そのID名のjsonファイルを作成し、storageに置く
         */

        const uid = (this.auth.currentUser) ? this.auth.currentUser.uid : null;
        const title = (_.has(jkfData, 'header') && _.has(jkfData['header'], 'title')) ? jkfData['header']['title'] : null;

        // 棋譜の表示モード
        const mode = (_.has(jkfData, 'initial') && _.has(jkfData['initial'], 'mode')) ? jkfData['initial']['mode'] : SHOGI.LIST.KIFU;
        
        if(!uid) {
            throw new Error('未ログインで棋譜投稿はできません。');
        }

        if(!title) {
            throw new Error('タイトル情報がjkfオブジェクトに含まれていません。');
        }

        // /kifuへの参照
        const kifuRef = (kifuID) ? this.database.ref('/kifu/' + kifuID) : this.database.ref('/kifu/').push();

        // jsonファイル名は発行した一意のID
        const jsonName = kifuRef.key;

        // /user_postsへの参照
        const userPostRef = this.database.ref('/user_posts/' + uid +'/'+ jsonName);

        // /usersへの参照
        const userRef = this.database.ref('/users/' + uid);

        const rootStorageRef = this.storage.ref();
        const uploadRef = rootStorageRef.child(jsonName +'.json');

        let jsonString: string = JSON.stringify(jkfData);

        // 日本語をエスケープ
        jsonString = jsonString.replace(/\W/g, (c: string) => {
            if(c.charCodeAt(0) > 256) {
                // アルファベット、半角記号以外
                return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
            }else {
                return c;
            }
        });

        const originArray: Array<number> = [];
        for(let i = 0,j = jsonString.length; i < j; ++ i){
            const JSON_ESCAPE_CHAR: RegExp = /\W/g;

            originArray[i] = jsonString.charCodeAt(i);
        }

        const uintArray = new Uint8Array(originArray);

        if(!kifuID) {
            return Promise.all([
                // jkf棋譜ファイルの/kifu以下へのdatabese登録処理
                // TODO: タグ登録処理
                kifuRef.set({
                    star: 0,
                    view: 0,
                    type: mode,
                    contributor: this.username,
                    title: title,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP,
                    description: 'dummy',
                    tags: {
                        '居飛車':true
                    }
                }),
    
                // 棋譜の/user_posts以下への登録処理
                userPostRef.set(true),
    
                // /usersの投稿数増加処理
                userRef.once('value').then((snapshot) => {
                    return Promise.resolve(snapshot.val()['posts']);
                }).then((postCount) => {
                    return userRef.child('posts').set(++postCount)
                }),
    
                // jkf棋譜ファイルのjsonアップロード処理
                uploadRef.put(uintArray).then((snapshot) => {            
                    console.log('success json put');
                }),
            ]).then(() => {
                console.log('success upload');
            });
        }else {
            return Promise.all([
                // update更新処理
                kifuRef.child('updatedAt').set(firebase.database.ServerValue.TIMESTAMP),

                // タイトル更新処理
                kifuRef.child('title').set(title),

                // jkf棋譜ファイルのjsonアップロード処理
                uploadRef.put(uintArray).then((snapshot) => {            
                    console.log('success json put');
                })
            ]).then(() => {
                console.log('success update');
            });
        }
    }

    private init () {
        return firebase.initializeApp({
            apiKey: CONFIG.FIREBASE_APIKEY,
            authDomain: CONFIG.FIREBASE_AUTHDOMAIN,
            databaseURL: CONFIG.FIREBASE_DBURL,
            projectId: CONFIG.FIREBASE_PROJECTID,
            storageBucket: CONFIG.FIREBASE_SBUCKET,
        });
    }
}

// ログインフローについて
/*

googleもしくはtwitterでログイン
-> 成功
    データベース照合
    -> ユーザー登録済
        ログイン完了

    -> ユーザー未登録
        スクリーンネーム登録ページへ移動
-> 失敗
    内容に応じてエラーを画面に表示

 */