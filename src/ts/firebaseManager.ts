import * as firebase from 'firebase';
import CONFIG from './fbconfig';

// jkf棋譜ファイルのアップロード処理を定義
// 最新の棋譜のID＋1をファイル名とする？

export default class FirebaseManager {
    private firebase: firebase.app.App;

    // ユーザー認証処理
    private auth: firebase.auth.Auth;

    // 各種ユーザー情報・棋譜情報等の格納
    private database: firebase.database.Database;

    // json棋譜ファイルのアップロード・ダウンロード
    private storage: firebase.storage.Storage;

    // シングルトンにするためのインスタンス
    private static _sharedManager: FirebaseManager;

    constructor() {
        this.firebase = this.init();
        this.auth = firebase.auth(this.firebase);
        this.database = firebase.database(this.firebase);
        this.storage = firebase.storage(this.firebase);
    }

    // 単一のインスタンスを返す
    public static get sharedManager (): FirebaseManager {
        if(!this._sharedManager) {
            this._sharedManager = new FirebaseManager();
        }

        return this._sharedManager;
    }

    // 匿名ログイン処理 おそらく棋譜保存確立後外す
    public anonymusLogin() {
        firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            let errorCode = error.code;
            let errorMessage = error.message;
        });

        console.log('oh anonymusLogin successed', this.auth.currentUser);
    }

    // ログイン処理
    public login() {
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

        console.log(this.auth.currentUser);

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
            });
        }
    }

    // 棋譜をロードする
    public kifuLoad(id: Number) {

    }

    // 棋譜をセーブする
    public kifuSave(jkfData: Object) {
        const rootRef = this.storage.ref();
        const uploadRef = rootRef.child('test.json');

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

        uploadRef.put(uintArray).then((snapshot) => {
            console.log(snapshot);
            console.log('oh file saved');
        });
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
