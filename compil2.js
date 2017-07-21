"use strict";
var parser = new Parser();
var compiler = new Compiler();

var com;


function error(err, n){
	printError(err, n);
}

function Parser(){
	var lastDefine;

	function isNumber(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function getRang(c){
		if(isNumber(c))
			return 1;
		switch(c){
			case '+':case '-':case '&':case '|':case '^':case '<':case '>':case '!':return 3;
			case '*':case '/':case '%':return 4;
			case '(':case '[':return 0;
			case ')':case ']':return 5;
			case ',':return 9;
			case '=':return 6;
			case ' ':case '\t':case '\v':case '\r':return 7;
			case '\n':return 7;
			case ';':case '{':case '}':return 8;
			case ':':return 11;
		} 
		return 2;
	}

	function functionExistInList(f){
		var a =['if','while','goto','input','print','printc','max','min','inc','dec','random','sqr','sqrt'];
		if(a.indexOf(f)>-1)
			return true;
		return false;
	}
	
	function defineReplacer(str, def, repl, offset, s) {
		lastDefine = [def ,repl];
		return ' ';
	}

	function define(s){
		lastDefine=1;
		while(lastDefine != 0){
			lastDefine = 0;
			s = s.replace(/#define *([^\s]*) *([^\n]*)/, defineReplacer);
			if(lastDefine != 0)
				s = s.replace(new RegExp(lastDefine[0], 'g'), lastDefine[1]);
			//console.log(s);
		}
		return s;
	}

	function precalculate(str, a, op, b, offset, s){
		if(op == '*')
			return a*b;
		if(op == '/')
			return Math.floor(a/b);
		return str;
	}
	
	function optimization(s){
		s = s.replace(/(\d+) *(\*) *(\d+)/g, precalculate);
		s = s.replace(/(\d+) *(\/) *(\d+)/g, precalculate);
		return s;
	}

	function pars(s){
		var token = [];
		var bufer = [];
		var rang = 0;
		var count = 0;
		var nameBuffer = '';
		var addBuffer = '';
		var buferCount = 0;
		var bracketCount = 0;
		token[0] = {};
		token[0].name = '';
		bufer[0] = {};
		bufer[0].name = '';
		s = s.replace(/\/\/.*/g,"");//remove comment
		s = define(s);
		s = optimization(s);
		for(var i=0; i<s.length; i++){
			//обработка строки
			if(s[i] == '"'){
				var stringBuffer = '"';
				for(var j = i+1; j < s.length; j++){
					if(s[j] == '"')
						break;
					else if(s[j] == '\\'){
						j++;
						if(s[j] == 'n')
							stringBuffer += '\n';
						else if(s[j] == 'r')
							stringBuffer += '\r';
						else if(s[j] == '\\')
							stringBuffer += '\\';
						else if(s[j] == '"')
							stringBuffer += '"';
					}
					else
						stringBuffer += s[j];
				}
				stringBuffer += s[j];
				i = j;
				rang = -1;
				token[count].name = stringBuffer;
				token[count].rang = 1;
			}
			else
				rang = getRang(s[i]);
			if(rang == 0){
				bracketCount++;
				bufer[buferCount].name = s[i];
				bufer[buferCount].rang = rang;
				buferCount++;
				bufer[buferCount] = {name:''};
				if(functionExistInList(token[count].name)){
					bufer[buferCount].name = token[count].name;
					bufer[buferCount].rang = 2;
					buferCount++;
					bufer[buferCount] = {name:''};
					token[count] = {name:''};
				}
				if(s[i] == '['){
					nameBuffer = token[count].name;
					token[count] = {name:'[',rang:12};
				}
				count++;
				token[count] = {name:''};
			}
			else if(rang == 1){
				token[count].name += s[i];
				token[count].rang = rang;
			}
			else if(rang == 2){
				token[count].name += s[i];
				token[count].rang = rang;
			}
			else if(rang == 5){
				bracketCount--;
				for(var j = buferCount - 1; j >= 0; j--){
					if(bufer[j].rang > 0){
						count++;
						token[count] = {};
						token[count].name = bufer[j].name;
						token[count].rang = bufer[j].rang;
						bufer[j].name = '';
						buferCount--; 
					}
					else{
						bufer[j].name = '';
						buferCount--;
						j = -1;
					} 
				}
				if(s[i] == ']'){
					count++;
					token[count] = {name:']',rang:13};
					count++;
					token[count] = {};
					token[count].rang = 2;
					token[count].name = nameBuffer;
					nameBuffer = '';
				}
				else{
				count++;
				token[count] = {name:'',rang:1};
				}
			}
			else if(rang == 6){
				addBuffer = token[count].name;
				token[count]={name:' ',rang:0};
				count++;
				token[count]={name:''};
				for(j = buferCount - 1; j >= 0; j--){
					if(bufer[j].rang > 2){
						count++;
						token[count]={};
						token[count].name = bufer[j].name;
						token[count].rang = bufer[j].rang;
						bufer[j].name = '';
						buferCount--; 
					}
					else{
						j = -1;
						count++;
						token[count] = {name:''};
					} 
				}
			}
			else if(rang == 7){
			// skip space
			}
			else if(rang == 8){
				if(token[count].name != '')
					count++;
				for(var j = bufer.length - 1; j >= 0; j--){
					token[count] = {};
					token[count].name = bufer[j].name;
					token[count].rang = bufer[j].rang;
					bufer[j].name = '';
					count++;
					token[count] = {name : ''};
				}
				buferCount = 0;
				if(addBuffer != ''){
					token[count] = {};
					token[count].name = '=';
					token[count].rang = 6;
					count++;
					token[count] = {};
					token[count].name = addBuffer;
					token[count].rang = 2;
					count++;		
					addBuffer = '';
				}
				token[count]={name : '' , rang : 8};
				token[count].name = s[i];
				count++;
				token[count] = {name : ''};
			}
			else if(rang == 9){
				for(var j = buferCount - 1; j >= 0; j--){
					if(bufer[j].rang > 2){
						count++;
						token[count] = {};
						token[count].name = bufer[j].name;
						token[count].rang = bufer[j].rang;
						bufer[j].name = '';  
						buferCount--; 
					}
					else{
						j = -1;
						count++;
						token[count] = {name : ',', rang : 9};
						count++;
						token[count] = {name : ''};
					} 
				}
			}
			else if(rang == 11){
				token[count].rang = 11;
				count++;
				token[count] = {name : ''};
			}
			else if(rang>2){
				if(token[count].rang <= rang){ 
					for(var j = buferCount - 1; j >= 0; j--){
						if(bufer[j].rang >= rang){
							count++;
							token[count] = {};
							token[count].name = bufer[j].name;
							token[count].rang = bufer[j].rang;
							bufer[j].name = '';
							buferCount--; 
						}
						else
							j = -1;
					}
				}
				bufer[buferCount].rang = rang;
				bufer[buferCount].name = s[i];
				if(s[i + 1] == '='){
					bufer[buferCount].name += '=';
					i++;
				}
				buferCount++;
				bufer[buferCount] = {name : ''};
				count++;
				token[count] = {name : ''};
			}
		}
		for(i = 0; i < token.length; i++){
			if(token[i].name.length < 1 || token[i].name == ' '){
				token.splice(i, 1);
				i--;
			}
		}
		if(bracketCount != 0)
			error(2);
		return token;
	}
	
	return {pars:pars};
}

function Compiler(){
	var out = [];
	var OFFSET = 0x100;//for com
	var PUSHINT = 0x68;//opcode Push
	var PUSHAX = 0x50;
	var PUSHDX = 0x52;
	var POPAX = 0x58;
	var POPBX = 0x5B;
	var POPCX = 0x59;
	var POPDX = 0x5A;
	var POPDI = 0x5F;
	var JUMP = 0xEB;
	var adress = 0;
	var adressPrintFunction;
	var adressRandomFunction;
	var calcAdressArray = [];
	var variablesArray = [];
	var ArrayArray = [];
	var jumpArray = [];
	var bracketArray = [];
	var lastStringEnd;
		
	function write8(){
		var n;
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] == 'number')
				n = arguments[i];
			else
				n = parseInt(arguments[i],10);
			out.push(String.fromCharCode(n & 0xFF));
			adress += 1;
		}
	}
	
	function write16(){
		var n;
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] == 'number')
				n = arguments[i];
			else
				n = parseInt(arguments[i],10);
			out.push(String.fromCharCode(n & 0xFF));
			out.push(String.fromCharCode((n >> 8) & 0xFF));
			adress += 2;
		}	
	}
	
	function write8toAddr(adr, n){
		out[adr - OFFSET] = String.fromCharCode(n & 0xFF);
	}
	
	function writeString(s){
		if(s.length > 254)
			s = s.substr(0, 254);
		write8(PUSHINT);
		write16(adress + 4);
		write8(JUMP);
		write8(s.length - 1);
		for(var i = 1; i < s.length - 1; i++)
			write8(s.charCodeAt(i));
		write8('$'.charCodeAt(0));
		
	}
	
	function includeRandom(){
		write8(0xC6, 0x06);//write a
		calcAdressArray.push(['buf' ,'rm' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x80);
		write8(0xC6, 0x06);//write b
		calcAdressArray.push(['buf' ,'ra' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x0B);
		write8(0xC6, 0x06);//write c
		calcAdressArray.push(['buf' ,'rx' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x03);
		write8(0xEB, 0x10);//jmp +16
		adressRandomFunction = adress;
		write8(0xA0);//mov al,x
		calcAdressArray.push(['buf' ,'rx' ,adress]);
		write8(0x00, 0x00);
		write8(0xF6, 0x26);//mul a
		calcAdressArray.push(['buf' ,'ra' ,adress]);
		write8(0x00, 0x00);
		write8(0xF6, 0x36);//div m
		calcAdressArray.push(['buf' ,'rm' ,adress]);
		write8(0x00, 0x00);
		write8(0x88, 0x26);//mov x,ah
		calcAdressArray.push(['buf' ,'rx' ,adress]);
		write8(0x00, 0x00);
		write8(0xC3);//ret
	}
	
	function includePrint(){
		write8(0xEB, 0x2B);//jmp +42
		adressPrintFunction = adress;
		write8(0xB9, 0x0A, 0x00);//mov cx,10
		write8(0xBB, 0x06, 0x00);//mov bx,6
		write8(0xC6, 0x87);//mov buffer+bx,
		calcAdressArray.push(['buf' ,'print' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x24);//$
		write8(0xBA, 0x00, 0x00);//mov dx,0
		write8(0xF7, 0xF1);//div cx
		write8(0x4B);//dec bx
		write8(0x92);//xchg ax,dx
		write8(0x05, 0x30, 0x00);//add ax, '0'
		//write8(0x33, 0xD2);//xor dx,dx
		write8(0x88, 0x87);//mov [bx]+buffer,al
		calcAdressArray.push(['buf' ,'print' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x92);//xchg ax,dx
		write8(0x3D, 0x00, 0x00);//cmp ax,0
		write8(0x75, 0xEC);//jne repeat
		write8(0xB8);//mov ax, buffer
		calcAdressArray.push(['buf' ,'print' ,adress]);
		write8(0x00, 0x00);//buffer
		write8(0x03, 0xC3);//add ax,bx
		write8(0x8B, 0xD0);//mov dx,ax
		write8(0xB4, 0x09);//mov ah,09
		write8(0xCD, 0x21);//int 21h
		write8(0xC3);//ret
	}
	
	function loadJmp(n){
		write8(PUSHINT);
		calcAdressArray.push(['jmp' ,n ,adress]);
		write16(0);
	}
	
	function loadVar(n){
		for (var i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == n){
				write8(0xA1);//MOV ax,addr
				calcAdressArray.push(['var' ,n ,adress]);
				write16(0x0);
				write8(PUSHAX);
				return true;
			}
		}
		return false;
	}
	
	function saveVar(n){
		for(var i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == n){
				write8(POPAX);
				write8(0xA3);//MOV addr,ax
				calcAdressArray.push(['var' ,n ,adress]);
				write16(0x0);
				//write8(PUSHAX);
				return true;
			}
		}
		variablesArray.push([n,0]);
		write8(POPAX);
		write8(0xA3);//MOV addr,ax
		calcAdressArray.push(['var' ,n ,adress]);
		write16(0x0);
		//write8(PUSHAX);
		return true;
	}
	
	function getAdress(n){
		for(var i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == n){
				return variablesArray[i][1];
			}
		}
		for (var i = 0; i < jumpArray.length; i++) {
			if(jumpArray[i][0] == n){
				return jumpArray[i][1];
			}
		}
		error(3, n);
		return 0;
	}
	
	function calcAddr(){
		var n;
		var adressBufer1,adressBufer2;
		var ramUse;
		adress++;
		ramUse = adress;
		if(adressPrintFunction > 0){
			adressBufer1 = adress;
			adress += 7;
		}
		if(adressRandomFunction > 0){
			adressBufer2 = adress;
			adress += 3;
		}
		for(var i = 0; i < variablesArray.length; i++){
			variablesArray[i][1] = adress + i;
		}
		adress += variablesArray.length + 1;
		for(i = 0; i < calcAdressArray.length; i++){
			if(calcAdressArray[i][0] == 'buf'){
				switch(calcAdressArray[i][1]){
					case 'print':
						n = adressBufer1;
						break;
					case 'rm':
						n = adressBufer2;
						break;
					case 'ra':
						n = adressBufer2 + 1;
						break;
					case 'rx':
						n = adressBufer2 + 2;
						break;
				}
			}
			else
				n = getAdress(calcAdressArray[i][1]);
			out[calcAdressArray[i][2] - OFFSET ] = String.fromCharCode(n & 0xFF);
			out[calcAdressArray[i][2] + 1 - OFFSET ] = String.fromCharCode((n >> 8 ) & 0xFF);
		}
		ramUse = adress - ramUse;
		error(5, ramUse);
		//console.log(out);
	}
	
	function compile(tokens){
		out = [];
		adress = OFFSET;
		adressPrintFunction = 0;
		adressRandomFunction = 0;
		calcAdressArray = [];
		variablesArray = [];
		ArrayArray = [];
		jumpArray = [];
		bracketArray = [];
		lastStringEnd = OFFSET;
		for(var i = 0; i < tokens.length; i++){
			var token = tokens[i];
			switch(token.rang){
				case 1:
					if(token.name[0] == '"'){
						//string
						writeString(token.name);
					}
					else{
						//number
						write8(PUSHINT);
						write16(token.name);
					}
					break;
				case 2:
					switch(token.name){
						case 'input':
							write8(0xB4);//mov ah,1
							write8(0x01);
							write8(0xCD);//int 21h
							write8(0x21);
							write8(0xB4);//mov ah,0
							write8(0x00);
							write8(0x2C);//sub al,30h
							write8(0x30);
							write8(PUSHAX);
							break;
						case 'inputc':
							write8(0xB4);//mov ah,1
							write8(0x01);
							write8(0xCD);//int 21h
							write8(0x21);
							write8(0xB4);//mov ah,0
							write8(0x00);
							write8(PUSHAX);
							break;
						case 'printc':
							write8(POPDX);//load dx
							write8(0xB4, 0x02);//mov ah,02h
							write8(0xCD, 0x21);//int 21h
							break;
						case 'print':
							if(tokens[i-1].name[0] == '"'){
								write8(POPDX);//load dx
								write8(0xB4, 0x09);//mov ah,09h
								write8(0xCD, 0x21);//int 21h
							}
							else{
								if(adressPrintFunction == 0)
									includePrint();
								write8(POPAX);//load ax
								write8(0xBA);//mov bx,adr
								write16(adressPrintFunction);
								write8(0xFF, 0xD2);//call bx
							}
							break;
						case 'random':
							if(adressRandomFunction == 0)
								includeRandom();
							write8(0xBA);//mov bx,adr
							write16(adressRandomFunction);
							write8(0xFF, 0xD2);//call bx
							write8(PUSHAX);
							break;
						case 'goto':
							write8(POPDI);//load di
							write8(0xFF, 0xE7);//jmp di
							break;
						case 'if':
							write8(POPAX);//load ax
							write8(0x3D, 0x00, 0x00);//cmp ax,0
							write8(0x74, 0x02)//je +2
							break;
						case 'while':
							write8(POPAX);//load ax
							write8(0x3D, 0x00, 0x00);//cmp ax,0
							write8(0x74, 0x02)//je +2
							break;
						default:
							if(!loadVar(token.name))
								loadJmp(token.name);
					}
					break;
				case 3:
					if(token.name == '+'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0x03, 0xC3);//ADD AX,BX
						write8(PUSHAX);
					}
					else if(token.name == '-'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0x2B, 0xC3);//SUB AX,BX
						write8(PUSHAX);
					}
					else if(token.name == '>'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0x3B, 0xC3);//CMP AX,BX
						write8(0x73, 0x05);//JNB end
						write8(0xB8, 0x00, 0x00);//MOV AX,0
						write8(0xEB, 0x03);//JMP end
						write8(0xB8, 0x01, 0x00);//MOV AX,1
						write8(PUSHAX);
					}
					else if(token.name == '<'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0x3B, 0xC3);//CMP AX,BX
						write8(0x72, 0x05);//JB end
						write8(0xB8, 0x00, 0x00);//MOV AX,0
						write8(0xEB, 0x03);//JMP end
						write8(0xB8, 0x01, 0x00);//MOV AX,1
						write8(PUSHAX);
					}
					break;
				case 4:
					if(token.name == '*'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0xF7, 0xE3);//MUL BX (AX=AX*BX)
						write8(PUSHAX);
					}
					else if(token.name == '/'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0xF7, 0xF3);//DIV BX (AX=AX/BX)
						write8(PUSHAX);
					}
					else if(token.name == '%'){
						write8(POPBX , POPAX);//load ax,bx
						write8(0xF7, 0xF3);//DIV BX (AX=AX/BX)
						write8(PUSHDX);
					}
					break;
				case 6:
					if(token.name == '='){
						i++;
						saveVar(tokens[i].name);
					}
					break;
				case 8:
					if(token.name == '{'){
						var op = 'if';
						if(i > 0 && tokens[i - 1].name == 'while')
							op = 'wh';
						write8(JUMP);
						write8(0x03);
						write8(0xE9);
						bracketArray.push([adress, lastStringEnd, op]);
						write16(0x0);
					}else if(token.name == '}'){
						var buf = bracketArray.pop();
						write8toAddr(buf[0], (adress - buf[0] - 2) & 0xFF);
						write8toAddr(buf[0] + 1, ((adress - buf[0] - 2) >> 8) & 0xFF);
						if(buf[2] == 'wh'){
							write8(0xE9);//jmp 16
							write8(~ ((adress - buf[1] + 1) & 0xFF));
							write8(~ (((adress - buf[1] + 1) >> 8) & 0xFF));	
						}						
					}else if(token.name == ';'){
						lastStringEnd = adress;
					}
					break;
				case 11:
					jumpArray.push([token.name,adress]);
					break;
				case 12:
					if(tokens[i + 2].rang == 13 && tokens[i + 4].rang == 8){
						ArrayArray.push(tokens[i + 3].name, tokens[i + 1].name.toString(10), 0);
						i += 4;
					}
					break;
			}
		}
		if(bracketArray.length>0)
			error(4);
		calcAddr();
		return out.join('');
	}
	
	return {compile:compile};
}
