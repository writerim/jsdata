/*
  author : Sergey Ivanov
  downloads : https://launchpad.net/jsdata
  version : 0.2
  email : vip.karamba@bk.ru
*/
(function() {

  ["onchange" , "onclick"].map(function( _event ){
    document[_event] = function(event) {
      var target = event.target; // где был клик?

      var _e = _event.replace('on' , '')

      var data_id = $(target).data('jsd_ctrl_uid')
      if( data_id ){
        var row = Join.id( data_id )
        if(typeof row.controller.events == 'object' && typeof row.controller.events[_e] == 'function'){
          row.controller.events[_e].call( row.object , row.res )
        }
      }

    };
  })

  var b64EncodeUnicode, extend, hasProp,
    hasProp1 = {}.hasOwnProperty;

  b64EncodeUnicode = function(str) {
    if (str == null) {
      str = '';
    }
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  };

  hasProp = {}.hasOwnProperty;

  extend = function(child, parent) {
    var ctor, j, key, len;
    for (j = 0, len = parent.length; j < len; j++) {
      key = parent[j];
      if (hasProp.call(parent, key)) {
        child[key] = parent[key];
      }
    }
    ctor = function() {
      return this.constructor = child;
    };
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
  };

  this.TObject = (function() {
    TObject.Types = {
      int: function(v) {
        if (isNaN(v)) {
          return 0;
        }
        return Number(v);
      },
      string: function(v) {
        return v;
      },
      bool: function(v) {
        return v === true;
      },
      ai: function(v) {
        return v;
      },
      array : function(v){
        if( Object.prototype.toString.call( v ) !== '[object Array]' ){
          return []
        }
        return v;
      },
      object : function(v){
        if( Object.prototype.toString.call( v ) !== '[object Object]' ){
          return {}
        }
        return v;
      },
      function : function(v){
        if( Object.prototype.toString.call( v ) !== '[object Function]' ){
          return function(){return null;}
        }
        return v;
      },
      def: function(v) {
        return v;
      }
    };

    TObject._cache = {};

    TObject.version = "0.2";

    // Шаблоны
    TObject.views = {}

    // таблица номер связи - шаблон - объект
    TObject.tableviews = {}

    TObject.set_cache = function(n, k, o) {
      TObject._cache[n] = TObject._cache[n] || {};
      o.uniq_key = k
      TObject._cache[n][k] = o;
      return TObject._cache[n][k];
    };

    TObject.get_cache = function(n, k) {
      TObject._cache[n] = TObject._cache[n] || {};
      return TObject._cache[n][k] || false;
    };

    TObject.unset = function( ){
      delete TObject._cache[ this.getName ][ this.uniq_key ]
    }

    this.makeCounter = function() {
      var currentCount = 1;

      return function() { // (**)
        return currentCount++;
      };
    }

    TObject.uid = this.makeCounter();


    function TObject(s, settings) {
      if (s == null) {
        s = {};
      }
      if (settings == null) {
        settings = {};
      }


      var iskey_keys  = [];
      var frooze_key  = [];
      var key_field   = false;
      var key_keys  = false;
      var key_f_key   = false;
      var key_other   = false;
      var fields  = this.fields;
      var ref     = this.fields;
      for (ident in ref) {
        if (!hasProp1.call(ref, ident)) continue;
        attrs = ref[ident];
        if( attrs.type == 'ai' ){
          if( typeof this.__proto__._ai == 'undefined' ){
            this.__proto__._ai = 1;
          }
          s[ident] = this.__proto__._ai++
        }
        if (typeof attrs !== 'object' || attrs === null) {
          continue;
        }
        if (typeof attrs.iskey !== 'undefined' && attrs.iskey) {
    iskey_keys.push(ident);
        }
        if (typeof attrs.isfrooze !== 'undefined' && attrs.isfrooze) {
          frooze_key.push(ident);
        }
      }
      uniq_key_rule = (function() {
        if (iskey_keys.length === 1) {
          return iskey_keys.shift();
        }
        if (iskey_keys.length > 1) {
          return iskey_keys;
        }
        if (frooze_key.length) {
          return frooze_key;
        }
        return Object.keys(fields);
      })();

      if (uniq_key_rule instanceof Array) {
        uniq_key = "<key:" + uniq_key_rule.reduce(function(res, _f , i) {
          if (s[_f]) {
      var f = ""
      if( typeof s[_f] == 'object' ){
        // TODO test
        f = s[_f].id
      }else{
        f = s[_f]
      }
            res = res + (!i ? "" : ";") +  f;
      // TODO test
          }else{
      res = res + (!i ? "" : ";") +  "[undefined]";
    }
          return res;
        }, '')  + "/>";
      } else {
        uniq_key = s[uniq_key_rule] || 0;
      }

      var isset = TObject.get_cache(this.getName, uniq_key);

      var OBJECT = !isset ? this : isset;

      if( !isset ){
        OBJECT._proto_ = {};


        OBJECT.ctrl_uid = []
        Object.defineProperty(OBJECT, 'ctrl_uid', {
          enumerable: false
        });
        Object.defineProperty(OBJECT, '_proto_', {
          enumerable: false
        });

        for( ident_fields in this.fields ){
          var proto_def = {
            value : undefined,
            isdef : undefined,
            __proto__ : {
              val_def : typeof this.fields[ident_fields].def != 'undefined' ? this.fields[ident_fields].def : undefined
            }
          }
          if( typeof s[ident_fields] != 'undefined' ){
            proto_def.value = s[ident_fields]
            proto_def.isdef = false
          }else{
            if( typeof this.fields[ident_fields].def != 'undefined' ){
              proto_def.value = this.fields[ident_fields].def
              proto_def.isdef = true
            }
          }

          if( typeof this.fields[ident_fields].type != 'undefined' ){
            if( TObject.Types[ this.fields[ident_fields].type ] == 'function' ){
              proto_def.value = TObject.Types[ this.fields[ident_fields].type ]( proto_def.value )
            }
          }

          OBJECT._proto_[ident_fields] = proto_def;


          OBJECT[ident_fields] = null;
          if( typeof this.fields[ident_fields].init == 'function' ){
            OBJECT._proto_[ident_fields].value = this.fields[ident_fields].init(OBJECT._proto_[ident_fields].value )
          }
        }

        OBJECT.clean = function( c ){
          if( typeof c != 'undefined' ){
            this._proto_[c] = {
              value : this._proto_[c].val_def,
              is_def : true
            }
          }
        }

        OBJECT.isdef = function( c ){
          if( typeof c != 'undefined' ){
            return this._proto_[c].value == this._proto_[c].val_def;
          }
        }

        TObject.set_cache(this.getName, uniq_key, OBJECT);
      }

      Object.keys(OBJECT._proto_).map(function(key){
        Object.defineProperty(OBJECT, key , {
          configurable: true,
          get : function(){
            var val = this._proto_[key].value
            if( typeof this.fields[key].getter != 'undefined' ){
              return this.fields[key].getter( val )
            }
            return val;
          },
          set : function(v){
            var val;
            if( typeof this.fields[key].setter != 'undefined' ){
              val = this.fields[key].setter( v , this )
            }else{
              val = v;
            }
            var is_edit = this._proto_[key].value != val
            this._proto_[key].value = val
            if( is_edit ){
              OBJECT.ctrl_uid.map(function(_id_ctrl){
                var ctrl = Join.id(_id_ctrl)
                if( typeof (ctrl.controller.listen && ctrl.controller.listen[key]) != 'undefined' ){
                  ctrl.controller.listen[key].call( ctrl.res , ctrl.object )
                }
              },OBJECT)
            }
          }
        });
      })

      for( ident in OBJECT._proto_ ){
        // Если данные не заданны пользователем
        if( !OBJECT._proto_[ident].def ){
          if( typeof s[ident] != 'undefined' ){
            var value = s[ident]
            if( typeof this.fields[ident].type != 'undefined' ){
            if( TObject.Types[ this.fields[ident].type ] != 'undefined' ){
                value = TObject.Types[ this.fields[ident].type ]( s[ident] )
              }
            }
            OBJECT._proto_[ident].value = value
            OBJECT._proto_[ident].isdef = false
            if( typeof this.fields[ident].isfroozen != 'undefined' ){
              Object.defineProperty(OBJECT._proto_[ident], 'value', {
                writable: false
              });
            }
          }else{
            //console.log( 222 )
          }
        }else{
          //console.log( 111 )
        }
      }
      if( this.getName == 'Join' ){

        this.object.ctrl_uid.push( this.id )

        if( typeof this.node != 'undefined' ){
          this.res = this.node
        }else{
          this.res = this.view.render( this.object )
        }

        $(this.res).data('jsd_ctrl_uid' , this.id)

        return this.res;

      }

      return TObject.get_cache(this.getName, uniq_key);
    }

    TObject.all = function() {
      var ar, i, obj, res;
      res = TObject._cache[this.getName];
      ar = [];
      for (i in res) {
        if (!hasProp1.call(res, i)) continue;
        obj = res[i];
        ar.push(obj);
      }
      return ar;
    };

    TObject.find = function(attrs) {
      var attrs = TObject.Types.object( attrs );
      if (!Object.keys(attrs).length) {
        return [];
      }
      return this.all().filter(function(_el) {
        var valid = true;
        for (i in attrs) {
          val = _el._proto_[i].value;
          if (valid) {
            if (typeof val !== 'undefined') {
              valid = attrs[i] === val;
            }
          }
        }
        return valid;
      });
    };

    TObject.first = function(attrs) {
      var attrs = TObject.Types.object( attrs );
      if (!Object.keys(attrs).length) {
        return [];
      }
      if( !Object.keys( attrs ).length ){
        return this.all().shift()
      }
      return this.find( attrs ).shift()
    };

    TObject.id = function(id) {
      var isset;
      if (id == null) {
        id = 0;
      }
      isset = TObject.get_cache(this.getName, id);
      if (isset) {
        return isset;
      } else {
        return new window[this.getName]({
          id: id
        });
      }
    };

    return TObject;

  })();

  this.Model = function(name, fields, settings) {
    if( name === null || typeof name == 'undefined' ){
      return undefined;
    }
    var fields = TObject.Types.object( fields );
    if( !Object.keys( fields ).length ) return undefined
    window[name] = function(s) {
      var s = TObject.Types.object( s );
      return window[name].__super__.constructor.call(this, s);
    };
    extend(window[name], TObject);
    window[name].__proto__ = TObject;
    window[name].prototype.getName = name;
    window[name].prototype.fields = fields;
    return window[name];
  };

  // Показывает как будет нарисован объект
  new Model('View',{
    ident : {
      type : "string",
      isfrooze : true,
      iskey : true
    },
    // Будет создан объект
    render : {
      type : 'function'
    },
  })

  // указывает как будут вляеть события node на объект
  // И как изменения объекта будут влиять на node
  new Model('Controller',{
    // Уникальное название по которому будем искать
    ident : {
      type : 'string',
      isfrooze : true,
      iskey : true
    },
    // Объект событий которые будут воздействовать на ноду
    listen : {
      type : 'object',
      isfrooze : true,
    },
    // события которые будут воздействовать на объект
    events : {
      type : 'object',
      isfrooze : true,
    },
  })

  // Связывает node или View с объектом
  // Возвращает подготовленную node
  new Model('Join',{
    id : {
      type : 'ai',
      iskey : true
    },
    controller : {
      type : 'string',
      getter : function( ident ){
        return new Controller({ ident : ident })
      }
    },
    node : {
      type : 'object',
    },
    object : {
      type : 'object',
    },
    view : {
      type : 'string',
      getter : function( ident ){
        return new View({ ident : ident })
      }
    },
    res : {
      type : 'object'
    }
  })


}).call(this);
