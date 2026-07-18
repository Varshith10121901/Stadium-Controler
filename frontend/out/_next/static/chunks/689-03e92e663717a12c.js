"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[689],{3166:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]])},8828:(e,t,n)=>{e.exports=n(83654)},14806:(e,t,n)=>{e.exports=n(30125)},16750:(e,t,n)=>{n.d(t,{N:()=>v});var i=n(88945),r=n(86717),o=n(12115),a=n(85339),s=Object.defineProperty;class l{constructor(){((e,t,n)=>((e,t,n)=>t in e?s(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n)(e,"symbol"!=typeof t?t+"":t,n))(this,"_listeners")}addEventListener(e,t){void 0===this._listeners&&(this._listeners={});let n=this._listeners;void 0===n[e]&&(n[e]=[]),-1===n[e].indexOf(t)&&n[e].push(t)}hasEventListener(e,t){if(void 0===this._listeners)return!1;let n=this._listeners;return void 0!==n[e]&&-1!==n[e].indexOf(t)}removeEventListener(e,t){if(void 0===this._listeners)return;let n=this._listeners[e];if(void 0!==n){let e=n.indexOf(t);-1!==e&&n.splice(e,1)}}dispatchEvent(e){if(void 0===this._listeners)return;let t=this._listeners[e.type];if(void 0!==t){e.target=this;let n=t.slice(0);for(let t=0,i=n.length;t<i;t++)n[t].call(this,e);e.target=null}}}var c=Object.defineProperty,u=(e,t,n)=>(((e,t,n)=>t in e?c(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n)(e,"symbol"!=typeof t?t+"":t,n),n);let d=new a.RlV,f=new a.Zcv,p=Math.cos(Math.PI/180*70),h=(e,t)=>(e%t+t)%t;class m extends l{constructor(e,t){super(),u(this,"object"),u(this,"domElement"),u(this,"enabled",!0),u(this,"target",new a.Pq0),u(this,"minDistance",0),u(this,"maxDistance",1/0),u(this,"minZoom",0),u(this,"maxZoom",1/0),u(this,"minPolarAngle",0),u(this,"maxPolarAngle",Math.PI),u(this,"minAzimuthAngle",-1/0),u(this,"maxAzimuthAngle",1/0),u(this,"enableDamping",!1),u(this,"dampingFactor",.05),u(this,"enableZoom",!0),u(this,"zoomSpeed",1),u(this,"enableRotate",!0),u(this,"rotateSpeed",1),u(this,"enablePan",!0),u(this,"panSpeed",1),u(this,"screenSpacePanning",!0),u(this,"keyPanSpeed",7),u(this,"zoomToCursor",!1),u(this,"autoRotate",!1),u(this,"autoRotateSpeed",2),u(this,"reverseOrbit",!1),u(this,"reverseHorizontalOrbit",!1),u(this,"reverseVerticalOrbit",!1),u(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),u(this,"mouseButtons",{LEFT:a.kBv.ROTATE,MIDDLE:a.kBv.DOLLY,RIGHT:a.kBv.PAN}),u(this,"touches",{ONE:a.wtR.ROTATE,TWO:a.wtR.DOLLY_PAN}),u(this,"target0"),u(this,"position0"),u(this,"zoom0"),u(this,"_domElementKeyEvents",null),u(this,"getPolarAngle"),u(this,"getAzimuthalAngle"),u(this,"setPolarAngle"),u(this,"setAzimuthalAngle"),u(this,"getDistance"),u(this,"getZoomScale"),u(this,"listenToKeyEvents"),u(this,"stopListenToKeyEvents"),u(this,"saveState"),u(this,"reset"),u(this,"update"),u(this,"connect"),u(this,"dispose"),u(this,"dollyIn"),u(this,"dollyOut"),u(this,"getScale"),u(this,"setScale"),this.object=e,this.domElement=t,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>m.phi,this.getAzimuthalAngle=()=>m.theta,this.setPolarAngle=e=>{let t=h(e,2*Math.PI),i=m.phi;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let r=Math.abs(t-i);2*Math.PI-r<r&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.phi=t-i,n.update()},this.setAzimuthalAngle=e=>{let t=h(e,2*Math.PI),i=m.theta;i<0&&(i+=2*Math.PI),t<0&&(t+=2*Math.PI);let r=Math.abs(t-i);2*Math.PI-r<r&&(t<i?t+=2*Math.PI:i+=2*Math.PI),v.theta=t-i,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=e=>{e.addEventListener("keydown",ee),this._domElementKeyEvents=e},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",ee),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(i),n.update(),l=s.NONE},this.update=(()=>{let t=new a.Pq0,r=new a.Pq0(0,1,0),o=new a.PTz().setFromUnitVectors(e.up,r),u=o.clone().invert(),h=new a.Pq0,g=new a.PTz,w=2*Math.PI;return function(){let x=n.object.position;o.setFromUnitVectors(e.up,r),u.copy(o).invert(),t.copy(x).sub(n.target),t.applyQuaternion(o),m.setFromVector3(t),n.autoRotate&&l===s.NONE&&C(2*Math.PI/60/60*n.autoRotateSpeed),n.enableDamping?(m.theta+=v.theta*n.dampingFactor,m.phi+=v.phi*n.dampingFactor):(m.theta+=v.theta,m.phi+=v.phi);let E=n.minAzimuthAngle,S=n.maxAzimuthAngle;isFinite(E)&&isFinite(S)&&(E<-Math.PI?E+=w:E>Math.PI&&(E-=w),S<-Math.PI?S+=w:S>Math.PI&&(S-=w),E<=S?m.theta=Math.max(E,Math.min(S,m.theta)):m.theta=m.theta>(E+S)/2?Math.max(E,m.theta):Math.min(S,m.theta)),m.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,m.phi)),m.makeSafe(),!0===n.enableDamping?n.target.addScaledVector(b,n.dampingFactor):n.target.add(b),n.zoomToCursor&&k||n.object.isOrthographicCamera?m.radius=B(m.radius):m.radius=B(m.radius*y),t.setFromSpherical(m),t.applyQuaternion(u),x.copy(n.target).add(t),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),!0===n.enableDamping?(v.theta*=1-n.dampingFactor,v.phi*=1-n.dampingFactor,b.multiplyScalar(1-n.dampingFactor)):(v.set(0,0,0),b.set(0,0,0));let M=!1;if(n.zoomToCursor&&k){let i=null;if(n.object instanceof a.ubm&&n.object.isPerspectiveCamera){let e=t.length();i=B(e*y);let r=e-i;n.object.position.addScaledVector(O,r),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let e=new a.Pq0(_.x,_.y,0);e.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/y)),n.object.updateProjectionMatrix(),M=!0;let r=new a.Pq0(_.x,_.y,0);r.unproject(n.object),n.object.position.sub(r).add(e),n.object.updateMatrixWorld(),i=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;null!==i&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(i).add(n.object.position):(d.origin.copy(n.object.position),d.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(d.direction))<p?e.lookAt(n.target):(f.setFromNormalAndCoplanarPoint(n.object.up,n.target),d.intersectPlane(f,n.target))))}else n.object instanceof a.qUd&&n.object.isOrthographicCamera&&(M=1!==y)&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/y)),n.object.updateProjectionMatrix());return y=1,k=!1,!!(M||h.distanceToSquared(n.object.position)>c||8*(1-g.dot(n.object.quaternion))>c)&&(n.dispatchEvent(i),h.copy(n.object.position),g.copy(n.object.quaternion),M=!1,!0)}})(),this.connect=e=>{n.domElement=e,n.domElement.style.touchAction="none",n.domElement.addEventListener("contextmenu",et),n.domElement.addEventListener("pointerdown",$),n.domElement.addEventListener("pointercancel",Q),n.domElement.addEventListener("wheel",J)},this.dispose=()=>{var e,t,i,r,o,a;n.domElement&&(n.domElement.style.touchAction="auto"),null==(e=n.domElement)||e.removeEventListener("contextmenu",et),null==(t=n.domElement)||t.removeEventListener("pointerdown",$),null==(i=n.domElement)||i.removeEventListener("pointercancel",Q),null==(r=n.domElement)||r.removeEventListener("wheel",J),null==(o=n.domElement)||o.ownerDocument.removeEventListener("pointermove",K),null==(a=n.domElement)||a.ownerDocument.removeEventListener("pointerup",Q),null!==n._domElementKeyEvents&&n._domElementKeyEvents.removeEventListener("keydown",ee)};let n=this,i={type:"change"},r={type:"start"},o={type:"end"},s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},l=s.NONE,c=1e-6,m=new a.YHV,v=new a.YHV,y=1,b=new a.Pq0,g=new a.I9Y,w=new a.I9Y,x=new a.I9Y,E=new a.I9Y,S=new a.I9Y,M=new a.I9Y,A=new a.I9Y,P=new a.I9Y,L=new a.I9Y,O=new a.Pq0,_=new a.I9Y,k=!1,z=[],j={};function T(){return Math.pow(.95,n.zoomSpeed)}function C(e){n.reverseOrbit||n.reverseHorizontalOrbit?v.theta+=e:v.theta-=e}function I(e){n.reverseOrbit||n.reverseVerticalOrbit?v.phi+=e:v.phi-=e}let R=(()=>{let e=new a.Pq0;return function(t,n){e.setFromMatrixColumn(n,0),e.multiplyScalar(-t),b.add(e)}})(),U=(()=>{let e=new a.Pq0;return function(t,i){!0===n.screenSpacePanning?e.setFromMatrixColumn(i,1):(e.setFromMatrixColumn(i,0),e.crossVectors(n.object.up,e)),e.multiplyScalar(t),b.add(e)}})(),D=(()=>{let e=new a.Pq0;return function(t,i){let r=n.domElement;if(r&&n.object instanceof a.ubm&&n.object.isPerspectiveCamera){let o=n.object.position;e.copy(o).sub(n.target);let a=e.length();R(2*t*(a*=Math.tan(n.object.fov/2*Math.PI/180))/r.clientHeight,n.object.matrix),U(2*i*a/r.clientHeight,n.object.matrix)}else r&&n.object instanceof a.qUd&&n.object.isOrthographicCamera?(R(t*(n.object.right-n.object.left)/n.object.zoom/r.clientWidth,n.object.matrix),U(i*(n.object.top-n.object.bottom)/n.object.zoom/r.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function N(e){n.object instanceof a.ubm&&n.object.isPerspectiveCamera||n.object instanceof a.qUd&&n.object.isOrthographicCamera?y=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function H(e){if(!n.zoomToCursor||!n.domElement)return;k=!0;let t=n.domElement.getBoundingClientRect(),i=e.clientX-t.left,r=e.clientY-t.top,o=t.width,a=t.height;_.x=i/o*2-1,_.y=-(r/a*2)+1,O.set(_.x,_.y,1).unproject(n.object).sub(n.object.position).normalize()}function B(e){return Math.max(n.minDistance,Math.min(n.maxDistance,e))}function Y(e){g.set(e.clientX,e.clientY)}function q(e){E.set(e.clientX,e.clientY)}function F(){if(1==z.length)g.set(z[0].pageX,z[0].pageY);else{let e=.5*(z[0].pageX+z[1].pageX),t=.5*(z[0].pageY+z[1].pageY);g.set(e,t)}}function W(){if(1==z.length)E.set(z[0].pageX,z[0].pageY);else{let e=.5*(z[0].pageX+z[1].pageX),t=.5*(z[0].pageY+z[1].pageY);E.set(e,t)}}function V(){let e=z[0].pageX-z[1].pageX,t=z[0].pageY-z[1].pageY,n=Math.sqrt(e*e+t*t);A.set(0,n)}function Z(e){if(1==z.length)w.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);w.set(n,i)}x.subVectors(w,g).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(C(2*Math.PI*x.x/t.clientHeight),I(2*Math.PI*x.y/t.clientHeight)),g.copy(w)}function X(e){if(1==z.length)S.set(e.pageX,e.pageY);else{let t=ei(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);S.set(n,i)}M.subVectors(S,E).multiplyScalar(n.panSpeed),D(M.x,M.y),E.copy(S)}function G(e){var t;let i=ei(e),r=e.pageX-i.x,o=e.pageY-i.y,a=Math.sqrt(r*r+o*o);P.set(0,a),L.set(0,Math.pow(P.y/A.y,n.zoomSpeed)),t=L.y,N(y/t),A.copy(P)}function $(e){var t,i,o;!1!==n.enabled&&(0===z.length&&(null==(t=n.domElement)||t.ownerDocument.addEventListener("pointermove",K),null==(i=n.domElement)||i.ownerDocument.addEventListener("pointerup",Q)),o=e,z.push(o),"touch"===e.pointerType?function(e){switch(en(e),z.length){case 1:switch(n.touches.ONE){case a.wtR.ROTATE:if(!1===n.enableRotate)return;F(),l=s.TOUCH_ROTATE;break;case a.wtR.PAN:if(!1===n.enablePan)return;W(),l=s.TOUCH_PAN;break;default:l=s.NONE}break;case 2:switch(n.touches.TWO){case a.wtR.DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&V(),n.enablePan&&W(),l=s.TOUCH_DOLLY_PAN;break;case a.wtR.DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&V(),n.enableRotate&&F(),l=s.TOUCH_DOLLY_ROTATE;break;default:l=s.NONE}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(r)}(e):function(e){let t;switch(e.button){case 0:t=n.mouseButtons.LEFT;break;case 1:t=n.mouseButtons.MIDDLE;break;case 2:t=n.mouseButtons.RIGHT;break;default:t=-1}switch(t){case a.kBv.DOLLY:if(!1===n.enableZoom)return;H(e),A.set(e.clientX,e.clientY),l=s.DOLLY;break;case a.kBv.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enablePan)return;q(e),l=s.PAN}else{if(!1===n.enableRotate)return;Y(e),l=s.ROTATE}break;case a.kBv.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(!1===n.enableRotate)return;Y(e),l=s.ROTATE}else{if(!1===n.enablePan)return;q(e),l=s.PAN}break;default:l=s.NONE}l!==s.NONE&&n.dispatchEvent(r)}(e))}function K(e){!1!==n.enabled&&("touch"===e.pointerType?function(e){switch(en(e),l){case s.TOUCH_ROTATE:if(!1===n.enableRotate)return;Z(e),n.update();break;case s.TOUCH_PAN:if(!1===n.enablePan)return;X(e),n.update();break;case s.TOUCH_DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&G(e),n.enablePan&&X(e),n.update();break;case s.TOUCH_DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&G(e),n.enableRotate&&Z(e),n.update();break;default:l=s.NONE}}(e):function(e){if(!1!==n.enabled)switch(l){case s.ROTATE:if(!1===n.enableRotate)return;w.set(e.clientX,e.clientY),x.subVectors(w,g).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(C(2*Math.PI*x.x/t.clientHeight),I(2*Math.PI*x.y/t.clientHeight)),g.copy(w),n.update();break;case s.DOLLY:var i,r;if(!1===n.enableZoom)return;(P.set(e.clientX,e.clientY),L.subVectors(P,A),L.y>0)?(i=T(),N(y/i)):L.y<0&&(r=T(),N(y*r)),A.copy(P),n.update();break;case s.PAN:if(!1===n.enablePan)return;S.set(e.clientX,e.clientY),M.subVectors(S,E).multiplyScalar(n.panSpeed),D(M.x,M.y),E.copy(S),n.update()}}(e))}function Q(e){var t,i,r;(function(e){delete j[e.pointerId];for(let t=0;t<z.length;t++)if(z[t].pointerId==e.pointerId)return void z.splice(t,1)})(e),0===z.length&&(null==(t=n.domElement)||t.releasePointerCapture(e.pointerId),null==(i=n.domElement)||i.ownerDocument.removeEventListener("pointermove",K),null==(r=n.domElement)||r.ownerDocument.removeEventListener("pointerup",Q)),n.dispatchEvent(o),l=s.NONE}function J(e){if(!1!==n.enabled&&!1!==n.enableZoom&&(l===s.NONE||l===s.ROTATE)){var t,i;e.preventDefault(),n.dispatchEvent(r),(H(e),e.deltaY<0)?(t=T(),N(y*t)):e.deltaY>0&&(i=T(),N(y/i)),n.update(),n.dispatchEvent(o)}}function ee(e){if(!1!==n.enabled&&!1!==n.enablePan){let t=!1;switch(e.code){case n.keys.UP:D(0,n.keyPanSpeed),t=!0;break;case n.keys.BOTTOM:D(0,-n.keyPanSpeed),t=!0;break;case n.keys.LEFT:D(n.keyPanSpeed,0),t=!0;break;case n.keys.RIGHT:D(-n.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),n.update())}}function et(e){!1!==n.enabled&&e.preventDefault()}function en(e){let t=j[e.pointerId];void 0===t&&(t=new a.I9Y,j[e.pointerId]=t),t.set(e.pageX,e.pageY)}function ei(e){return j[(e.pointerId===z[0].pointerId?z[1]:z[0]).pointerId]}this.dollyIn=(e=T())=>{N(y*e),n.update()},this.dollyOut=(e=T())=>{N(y/e),n.update()},this.getScale=()=>y,this.setScale=e=>{N(e),n.update()},this.getZoomScale=()=>T(),void 0!==t&&this.connect(t),this.update()}}let v=o.forwardRef(({makeDefault:e,camera:t,regress:n,domElement:a,enableDamping:s=!0,keyEvents:l=!1,onChange:c,onStart:u,onEnd:d,...f},p)=>{let h=(0,r.C)(e=>e.invalidate),v=(0,r.C)(e=>e.camera),y=(0,r.C)(e=>e.gl),b=(0,r.C)(e=>e.events),g=(0,r.C)(e=>e.setEvents),w=(0,r.C)(e=>e.set),x=(0,r.C)(e=>e.get),E=(0,r.C)(e=>e.performance),S=t||v,M=a||b.connected||y.domElement,A=o.useMemo(()=>new m(S),[S]);return(0,r.D)(()=>{A.enabled&&A.update()},-1),o.useEffect(()=>(l&&A.connect(!0===l?M:l),A.connect(M),()=>void A.dispose()),[l,M,n,A,h]),o.useEffect(()=>{let e=e=>{h(),n&&E.regress(),c&&c(e)},t=e=>{u&&u(e)},i=e=>{d&&d(e)};return A.addEventListener("change",e),A.addEventListener("start",t),A.addEventListener("end",i),()=>{A.removeEventListener("start",t),A.removeEventListener("end",i),A.removeEventListener("change",e)}},[c,u,d,A,h,g]),o.useEffect(()=>{if(e){let e=x().controls;return w({controls:A}),()=>w({controls:e})}},[e,A]),o.createElement("primitive",(0,i.A)({ref:p,object:A,enableDamping:s},f))})},17910:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]])},18085:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]])},21873:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]])},23689:(e,t,n)=>{n.d(t,{DY:()=>a,IU:()=>l,uv:()=>s});let i=[];function r(e,t,n=(e,t)=>e===t){if(e===t)return!0;if(!e||!t)return!1;let i=e.length;if(t.length!==i)return!1;for(let r=0;r<i;r++)if(!n(e[r],t[r]))return!1;return!0}function o(e,t=null,n=!1,a={}){for(let o of(null===t&&(t=[e]),i))if(r(t,o.keys,o.equal)){if(n)return;if(Object.prototype.hasOwnProperty.call(o,"error"))throw o.error;if(Object.prototype.hasOwnProperty.call(o,"response"))return a.lifespan&&a.lifespan>0&&(o.timeout&&clearTimeout(o.timeout),o.timeout=setTimeout(o.remove,a.lifespan)),o.response;if(!n)throw o.promise}let s={keys:t,equal:a.equal,remove:()=>{let e=i.indexOf(s);-1!==e&&i.splice(e,1)},promise:("object"==typeof e&&"function"==typeof e.then?e:e(...t)).then(e=>{s.response=e,a.lifespan&&a.lifespan>0&&(s.timeout=setTimeout(s.remove,a.lifespan))}).catch(e=>s.error=e)};if(i.push(s),!n)throw s.promise}let a=(e,t,n)=>o(e,t,!1,n),s=(e,t,n)=>void o(e,t,!0,n),l=e=>{if(void 0===e||0===e.length)i.splice(0,i.length);else{let t=i.find(t=>r(e,t.keys,t.equal));t&&t.remove()}}},26983:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]])},30125:(e,t,n)=>{var i=n(12115),r="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},o=i.useState,a=i.useEffect,s=i.useLayoutEffect,l=i.useDebugValue;function c(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!r(e,n)}catch(e){return!0}}var u="undefined"==typeof window||void 0===window.document||void 0===window.document.createElement?function(e,t){return t()}:function(e,t){var n=t(),i=o({inst:{value:n,getSnapshot:t}}),r=i[0].inst,u=i[1];return s(function(){r.value=n,r.getSnapshot=t,c(r)&&u({inst:r})},[e,n,t]),a(function(){return c(r)&&u({inst:r}),e(function(){c(r)&&u({inst:r})})},[e]),l(n),n};t.useSyncExternalStore=void 0!==i.useSyncExternalStore?i.useSyncExternalStore:u},30258:(e,t,n)=>{n.d(t,{Hl:()=>d});var i=n(86717),r=n(12115),o=n(87548);function a(e,t){let n;return(...i)=>{window.clearTimeout(n),n=window.setTimeout(()=>e(...i),t)}}let s=["x","y","top","bottom","left","right","width","height"];var l=n(54735),c=n(95155);function u({ref:e,children:t,fallback:n,resize:l,style:u,gl:d,events:f=i.f,eventSource:p,eventPrefix:h,shadows:m,linear:v,flat:y,legacy:b,orthographic:g,frameloop:w,dpr:x,performance:E,raycaster:S,camera:M,scene:A,onPointerMissed:P,onCreated:L,...O}){r.useMemo(()=>(0,i.e)(o),[]);let _=(0,i.u)(),[k,z]=function({debounce:e,scroll:t,polyfill:n,offsetSize:i}={debounce:0,scroll:!1,offsetSize:!1}){var o,l,c;let u=n||("undefined"==typeof window?class{}:window.ResizeObserver);if(!u)throw Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");let[d,f]=(0,r.useState)({left:0,top:0,width:0,height:0,bottom:0,right:0,x:0,y:0}),p=(0,r.useRef)({element:null,scrollContainers:null,resizeObserver:null,lastBounds:d,orientationHandler:null}),h=e?"number"==typeof e?e:e.scroll:null,m=e?"number"==typeof e?e:e.resize:null,v=(0,r.useRef)(!1);(0,r.useEffect)(()=>(v.current=!0,()=>void(v.current=!1)));let[y,b,g]=(0,r.useMemo)(()=>{let e=()=>{let e,t;if(!p.current.element)return;let{left:n,top:r,width:o,height:a,bottom:l,right:c,x:u,y:d}=p.current.element.getBoundingClientRect(),h={left:n,top:r,width:o,height:a,bottom:l,right:c,x:u,y:d};p.current.element instanceof HTMLElement&&i&&(h.height=p.current.element.offsetHeight,h.width=p.current.element.offsetWidth),Object.freeze(h),v.current&&(e=p.current.lastBounds,t=h,!s.every(n=>e[n]===t[n]))&&f(p.current.lastBounds=h)};return[e,m?a(e,m):e,h?a(e,h):e]},[f,i,h,m]);function w(){p.current.scrollContainers&&(p.current.scrollContainers.forEach(e=>e.removeEventListener("scroll",g,!0)),p.current.scrollContainers=null),p.current.resizeObserver&&(p.current.resizeObserver.disconnect(),p.current.resizeObserver=null),p.current.orientationHandler&&("orientation"in screen&&"removeEventListener"in screen.orientation?screen.orientation.removeEventListener("change",p.current.orientationHandler):"onorientationchange"in window&&window.removeEventListener("orientationchange",p.current.orientationHandler))}function x(){p.current.element&&(p.current.resizeObserver=new u(g),p.current.resizeObserver.observe(p.current.element),t&&p.current.scrollContainers&&p.current.scrollContainers.forEach(e=>e.addEventListener("scroll",g,{capture:!0,passive:!0})),p.current.orientationHandler=()=>{g()},"orientation"in screen&&"addEventListener"in screen.orientation?screen.orientation.addEventListener("change",p.current.orientationHandler):"onorientationchange"in window&&window.addEventListener("orientationchange",p.current.orientationHandler))}return o=g,l=!!t,(0,r.useEffect)(()=>{if(l)return window.addEventListener("scroll",o,{capture:!0,passive:!0}),()=>void window.removeEventListener("scroll",o,!0)},[o,l]),c=b,(0,r.useEffect)(()=>(window.addEventListener("resize",c),()=>void window.removeEventListener("resize",c)),[c]),(0,r.useEffect)(()=>{w(),x()},[t,g,b]),(0,r.useEffect)(()=>w,[]),[e=>{e&&e!==p.current.element&&(w(),p.current.element=e,p.current.scrollContainers=function e(t){let n=[];if(!t||t===document.body)return n;let{overflow:i,overflowX:r,overflowY:o}=window.getComputedStyle(t);return[i,r,o].some(e=>"auto"===e||"scroll"===e)&&n.push(t),[...n,...e(t.parentElement)]}(e),x())},d,y]}({scroll:!0,debounce:{scroll:50,resize:0},...l}),j=r.useRef(null),T=r.useRef(null);r.useImperativeHandle(e,()=>j.current);let C=(0,i.a)(P),[I,R]=r.useState(!1),[U,D]=r.useState(!1);if(I)throw I;if(U)throw U;let N=r.useRef(null);(0,i.b)(()=>{let e=j.current;z.width>0&&z.height>0&&e&&(N.current||(N.current=(0,i.c)(e)),async function(){await N.current.configure({gl:d,scene:A,events:f,shadows:m,linear:v,flat:y,legacy:b,orthographic:g,frameloop:w,dpr:x,performance:E,raycaster:S,camera:M,size:z,onPointerMissed:(...e)=>null==C.current?void 0:C.current(...e),onCreated:e=>{null==e.events.connect||e.events.connect(p?(0,i.i)(p)?p.current:p:T.current),h&&e.setEvents({compute:(e,t)=>{let n=e[h+"X"],i=e[h+"Y"];t.pointer.set(n/t.size.width*2-1,-(2*(i/t.size.height))+1),t.raycaster.setFromCamera(t.pointer,t.camera)}}),null==L||L(e)}}),N.current.render((0,c.jsx)(_,{children:(0,c.jsx)(i.E,{set:D,children:(0,c.jsx)(r.Suspense,{fallback:(0,c.jsx)(i.B,{set:R}),children:null!=t?t:null})})}))}())}),r.useEffect(()=>{let e=j.current;if(e)return()=>(0,i.d)(e)},[]);let H=p?"none":"auto";return(0,c.jsx)("div",{ref:T,style:{position:"relative",width:"100%",height:"100%",overflow:"hidden",pointerEvents:H,...u},...O,children:(0,c.jsx)("div",{ref:k,style:{width:"100%",height:"100%"},children:(0,c.jsx)("canvas",{ref:j,style:{display:"block"},children:n})})})}function d(e){return(0,c.jsx)(l.Af,{children:(0,c.jsx)(u,{...e})})}n(49914)},35951:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Footprints",[["path",{d:"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z",key:"1dudjm"}],["path",{d:"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z",key:"l2t8xc"}],["path",{d:"M16 17h4",key:"1dejxt"}],["path",{d:"M4 13h4",key:"1bwh8b"}]])},37494:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]])},37586:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]])},43646:(e,t,n)=>{let i,r;n.d(t,{E:()=>g});var o=n(88945),a=n(12115),s=n(12669),l=n(85339),c=n(86717);let u=new l.Pq0,d=new l.Pq0,f=new l.Pq0,p=new l.I9Y;function h(e,t,n){let i=u.setFromMatrixPosition(e.matrixWorld);i.project(t);let r=n.width/2,o=n.height/2;return[i.x*r+r,-(i.y*o)+o]}let m=e=>1e-10>Math.abs(e)?0:e;function v(e,t,n=""){let i="matrix3d(";for(let n=0;16!==n;n++)i+=m(t[n]*e.elements[n])+(15!==n?",":")");return n+i}let y=(i=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>v(e,i)),b=(r=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>v(e,r(t),"translate(-50%,-50%)")),g=a.forwardRef(({children:e,eps:t=.001,style:n,className:i,prepend:r,center:v,fullscreen:g,portal:w,distanceFactor:x,sprite:E=!1,transform:S=!1,occlude:M,onOcclude:A,castShadow:P,receiveShadow:L,material:O,geometry:_,zIndexRange:k=[0x1000037,0],calculatePosition:z=h,as:j="div",wrapperClass:T,pointerEvents:C="auto",...I},R)=>{let{gl:U,camera:D,scene:N,size:H,raycaster:B,events:Y,viewport:q}=(0,c.C)(),[F]=a.useState(()=>document.createElement(j)),W=a.useRef(null),V=a.useRef(null),Z=a.useRef(0),X=a.useRef([0,0]),G=a.useRef(null),$=a.useRef(null),K=(null==w?void 0:w.current)||Y.connected||U.domElement.parentNode,Q=a.useRef(null),J=a.useRef(!1),ee=a.useMemo(()=>M&&"blending"!==M||Array.isArray(M)&&M.length&&function(e){return e&&"object"==typeof e&&"current"in e}(M[0]),[M]);a.useLayoutEffect(()=>{let e=U.domElement;M&&"blending"===M?(e.style.zIndex=`${Math.floor(k[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[M]),a.useLayoutEffect(()=>{if(V.current){let e=W.current=s.createRoot(F);if(N.updateMatrixWorld(),S)F.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=z(V.current,D,H);F.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return K&&(r?K.prepend(F):K.appendChild(F)),()=>{K&&K.removeChild(F),e.unmount()}}},[K,S]),a.useLayoutEffect(()=>{T&&(F.className=T)},[T]);let et=a.useMemo(()=>S?{position:"absolute",top:0,left:0,width:H.width,height:H.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:v?"translate3d(-50%,-50%,0)":"none",...g&&{top:-H.height/2,left:-H.width/2,width:H.width,height:H.height},...n},[n,v,g,H,S]),en=a.useMemo(()=>({position:"absolute",pointerEvents:C}),[C]);a.useLayoutEffect(()=>{var t,r;J.current=!1,S?null==(t=W.current)||t.render(a.createElement("div",{ref:G,style:et},a.createElement("div",{ref:$,style:en},a.createElement("div",{ref:R,className:i,style:n,children:e})))):null==(r=W.current)||r.render(a.createElement("div",{ref:R,style:et,className:i,children:e}))});let ei=a.useRef(!0);(0,c.D)(e=>{if(V.current){D.updateMatrixWorld(),V.current.updateWorldMatrix(!0,!1);let e=S?X.current:z(V.current,D,H);if(S||Math.abs(Z.current-D.zoom)>t||Math.abs(X.current[0]-e[0])>t||Math.abs(X.current[1]-e[1])>t){let t=function(e,t){let n=u.setFromMatrixPosition(e.matrixWorld),i=d.setFromMatrixPosition(t.matrixWorld),r=n.sub(i),o=t.getWorldDirection(f);return r.angleTo(o)>Math.PI/2}(V.current,D),n=!1;ee&&(Array.isArray(M)?n=M.map(e=>e.current):"blending"!==M&&(n=[N]));let i=ei.current;n?ei.current=function(e,t,n,i){let r=u.setFromMatrixPosition(e.matrixWorld),o=r.clone();o.project(t),p.set(o.x,o.y),n.setFromCamera(p,t);let a=n.intersectObjects(i,!0);if(a.length){let e=a[0].distance;return r.distanceTo(n.ray.origin)<e}return!0}(V.current,D,B,n)&&!t:ei.current=!t,i!==ei.current&&(A?A(!ei.current):F.style.display=ei.current?"block":"none");let r=Math.floor(k[0]/2),o=M?ee?[k[0],r]:[r-1,0]:k;if(F.style.zIndex=`${function(e,t,n){if(t instanceof l.ubm||t instanceof l.qUd){let i=u.setFromMatrixPosition(e.matrixWorld),r=d.setFromMatrixPosition(t.matrixWorld),o=i.distanceTo(r),a=(n[1]-n[0])/(t.far-t.near),s=n[1]-a*t.far;return Math.round(a*o+s)}}(V.current,D,o)}`,S){let[e,t]=[H.width/2,H.height/2],n=D.projectionMatrix.elements[5]*t,{isOrthographicCamera:i,top:r,left:o,bottom:a,right:s}=D,l=y(D.matrixWorldInverse),c=i?`scale(${n})translate(${m(-(s+o)/2)}px,${m((r+a)/2)}px)`:`translateZ(${n}px)`,u=V.current.matrixWorld;E&&((u=D.matrixWorldInverse.clone().transpose().copyPosition(u).scale(V.current.scale)).elements[3]=u.elements[7]=u.elements[11]=0,u.elements[15]=1),F.style.width=H.width+"px",F.style.height=H.height+"px",F.style.perspective=i?"":`${n}px`,G.current&&$.current&&(G.current.style.transform=`${c}${l}translate(${e}px,${t}px)`,$.current.style.transform=b(u,1/((x||10)/400)))}else{let t=void 0===x?1:function(e,t){if(t instanceof l.qUd)return t.zoom;if(!(t instanceof l.ubm))return 1;{let n=u.setFromMatrixPosition(e.matrixWorld),i=d.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*n.distanceTo(i))}}(V.current,D)*x;F.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}X.current=e,Z.current=D.zoom}}if(!ee&&Q.current&&!J.current)if(S){if(G.current){let e=G.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=D;if(t||_)I.scale&&(Array.isArray(I.scale)?I.scale instanceof l.Pq0?Q.current.scale.copy(I.scale.clone().divideScalar(1)):Q.current.scale.set(1/I.scale[0],1/I.scale[1],1/I.scale[2]):Q.current.scale.setScalar(1/I.scale));else{let t=(x||10)/400,n=e.clientWidth*t,i=e.clientHeight*t;Q.current.scale.set(n,i,1)}J.current=!0}}}else{let t=F.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/q.factor,n=t.clientWidth*e,i=t.clientHeight*e;Q.current.scale.set(n,i,1),J.current=!0}Q.current.lookAt(e.camera.position)}});let er=a.useMemo(()=>({vertexShader:S?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[S]);return a.createElement("group",(0,o.A)({},I,{ref:V}),M&&!ee&&a.createElement("mesh",{castShadow:P,receiveShadow:L,ref:Q},_||a.createElement("planeGeometry",null),O||a.createElement("shaderMaterial",{side:l.$EB,vertexShader:er.vertexShader,fragmentShader:er.fragmentShader})))})},46858:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("DoorOpen",[["path",{d:"M13 4h3a2 2 0 0 1 2 2v14",key:"hrm0s9"}],["path",{d:"M2 20h3",key:"1gaodv"}],["path",{d:"M13 20h9",key:"s90cdi"}],["path",{d:"M10 12v.01",key:"vx6srw"}],["path",{d:"M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z",key:"199qr4"}]])},48055:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Coins",[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]])},49914:(e,t,n)=>{e.exports=n(66451)},54735:(e,t,n)=>{n.d(t,{Af:()=>s,Nz:()=>r,u5:()=>l,y3:()=>d});var i=n(12115);function r(e,t,n){if(!e)return;if(!0===n(e))return e;let i=t?e.return:e.child;for(;i;){let e=r(i,t,n);if(e)return e;i=t?null:i.sibling}}function o(e){try{return Object.defineProperties(e,{_currentRenderer:{get:()=>null,set(){}},_currentRenderer2:{get:()=>null,set(){}}})}catch(t){return e}}(()=>{var e,t;return"undefined"!=typeof window&&((null==(e=window.document)?void 0:e.createElement)||(null==(t=window.navigator)?void 0:t.product)==="ReactNative")})()?i.useLayoutEffect:i.useEffect;let a=o(i.createContext(null));class s extends i.Component{render(){return i.createElement(a.Provider,{value:this._reactInternals},this.props.children)}}function l(){let e=i.useContext(a);if(null===e)throw Error("its-fine: useFiber must be called within a <FiberProvider />!");let t=i.useId();return i.useMemo(()=>{for(let n of[e,null==e?void 0:e.alternate]){if(!n)continue;let e=r(n,!1,e=>{let n=e.memoizedState;for(;n;){if(n.memoizedState===t)return!0;n=n.next}});if(e)return e}},[e,t])}let c=Symbol.for("react.context"),u=e=>null!==e&&"object"==typeof e&&"$$typeof"in e&&e.$$typeof===c;function d(){let e=function(){let e=l(),[t]=i.useState(()=>new Map);t.clear();let n=e;for(;n;){let e=n.type;u(e)&&e!==a&&!t.has(e)&&t.set(e,i.use(o(e))),n=n.return}return t}();return i.useMemo(()=>Array.from(e.keys()).reduce((t,n)=>r=>i.createElement(t,null,i.createElement(n.Provider,{...r,value:e.get(n)})),e=>i.createElement(s,{...e})),[e])}},57828:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},59427:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]])},65229:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},66451:(e,t)=>{function n(e,t){var n=e.length;for(e.push(t);0<n;){var i=n-1>>>1,r=e[i];if(0<o(r,t))e[i]=t,e[n]=r,n=i;else break}}function i(e){return 0===e.length?null:e[0]}function r(e){if(0===e.length)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;for(var i=0,r=e.length,a=r>>>1;i<a;){var s=2*(i+1)-1,l=e[s],c=s+1,u=e[c];if(0>o(l,n))c<r&&0>o(u,l)?(e[i]=u,e[c]=n,i=c):(e[i]=l,e[s]=n,i=s);else if(c<r&&0>o(u,n))e[i]=u,e[c]=n,i=c;else break}}return t}function o(e,t){var n=e.sortIndex-t.sortIndex;return 0!==n?n:e.id-t.id}if(t.unstable_now=void 0,"object"==typeof performance&&"function"==typeof performance.now){var a,s=performance;t.unstable_now=function(){return s.now()}}else{var l=Date,c=l.now();t.unstable_now=function(){return l.now()-c}}var u=[],d=[],f=1,p=null,h=3,m=!1,v=!1,y=!1,b=!1,g="function"==typeof setTimeout?setTimeout:null,w="function"==typeof clearTimeout?clearTimeout:null,x="undefined"!=typeof setImmediate?setImmediate:null;function E(e){for(var t=i(d);null!==t;){if(null===t.callback)r(d);else if(t.startTime<=e)r(d),t.sortIndex=t.expirationTime,n(u,t);else break;t=i(d)}}function S(e){if(y=!1,E(e),!v)if(null!==i(u))v=!0,M||(M=!0,a());else{var t=i(d);null!==t&&j(S,t.startTime-e)}}var M=!1,A=-1,P=5,L=-1;function O(){return!!b||!(t.unstable_now()-L<P)}function _(){if(b=!1,M){var e=t.unstable_now();L=e;var n=!0;try{e:{v=!1,y&&(y=!1,w(A),A=-1),m=!0;var o=h;try{t:{for(E(e),p=i(u);null!==p&&!(p.expirationTime>e&&O());){var s=p.callback;if("function"==typeof s){p.callback=null,h=p.priorityLevel;var l=s(p.expirationTime<=e);if(e=t.unstable_now(),"function"==typeof l){p.callback=l,E(e),n=!0;break t}p===i(u)&&r(u),E(e)}else r(u);p=i(u)}if(null!==p)n=!0;else{var c=i(d);null!==c&&j(S,c.startTime-e),n=!1}}break e}finally{p=null,h=o,m=!1}}}finally{n?a():M=!1}}}if("function"==typeof x)a=function(){x(_)};else if("undefined"!=typeof MessageChannel){var k=new MessageChannel,z=k.port2;k.port1.onmessage=_,a=function(){z.postMessage(null)}}else a=function(){g(_,0)};function j(e,n){A=g(function(){e(t.unstable_now())},n)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(e){e.callback=null},t.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):P=0<e?Math.floor(1e3/e):5},t.unstable_getCurrentPriorityLevel=function(){return h},t.unstable_next=function(e){switch(h){case 1:case 2:case 3:var t=3;break;default:t=h}var n=h;h=t;try{return e()}finally{h=n}},t.unstable_requestPaint=function(){b=!0},t.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=h;h=e;try{return t()}finally{h=n}},t.unstable_scheduleCallback=function(e,r,o){var s=t.unstable_now();switch(o="object"==typeof o&&null!==o&&"number"==typeof(o=o.delay)&&0<o?s+o:s,e){case 1:var l=-1;break;case 2:l=250;break;case 5:l=0x3fffffff;break;case 4:l=1e4;break;default:l=5e3}return l=o+l,e={id:f++,callback:r,priorityLevel:e,startTime:o,expirationTime:l,sortIndex:-1},o>s?(e.sortIndex=o,n(d,e),null===i(u)&&e===i(d)&&(y?(w(A),A=-1):y=!0,j(S,o-s))):(e.sortIndex=l,n(u,e),v||m||(v=!0,M||(M=!0,a()))),e},t.unstable_shouldYield=O,t.unstable_wrapCallback=function(e){var t=h;return function(){var n=h;h=t;try{return e.apply(this,arguments)}finally{h=n}}}},69587:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Coffee",[["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M14 2v2",key:"6buw04"}],["path",{d:"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",key:"pwadti"}],["path",{d:"M6 2v2",key:"colzsn"}]])},70532:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]])},76561:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Navigation",[["polygon",{points:"3 11 22 2 13 21 11 13 3 11",key:"1ltx0t"}]])},83580:(e,t,n)=>{n.d(t,{h:()=>l});var i=n(12115),r=n(8828),o=n(90490);let{useSyncExternalStoreWithSelector:a}=r,s=(e,t)=>{let n=(0,o.y)(e),r=(e,r=t)=>(function(e,t=e=>e,n){let r=a(e.subscribe,e.getState,e.getInitialState,t,n);return i.useDebugValue(r),r})(n,e,r);return Object.assign(r,n),r},l=(e,t)=>e?s(e,t):s},83654:(e,t,n)=>{var i=n(12115),r=n(14806),o="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},a=r.useSyncExternalStore,s=i.useRef,l=i.useEffect,c=i.useMemo,u=i.useDebugValue;t.useSyncExternalStoreWithSelector=function(e,t,n,i,r){var d=s(null);if(null===d.current){var f={hasValue:!1,value:null};d.current=f}else f=d.current;var p=a(e,(d=c(function(){function e(e){if(!l){if(l=!0,a=e,e=i(e),void 0!==r&&f.hasValue){var t=f.value;if(r(t,e))return s=t}return s=e}if(t=s,o(a,e))return t;var n=i(e);return void 0!==r&&r(t,n)?(a=e,t):(a=e,s=n)}var a,s,l=!1,c=void 0===n?null:n;return[function(){return e(t())},null===c?void 0:function(){return e(c())}]},[t,n,i,r]))[0],d[1]);return l(function(){f.hasValue=!0,f.value=p},[p]),u(p),p}},85571:(e,t,n)=>{let i,r;n.d(t,{N:()=>T});var o=n(88945),a=n(12115),s=n(85339),l=n(86717);let c=new s.NRn,u=new s.Pq0;class d extends s.CmU{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new s.qtW([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new s.qtW([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new s.LuO(t,6,1);return this.setAttribute("instanceStart",new s.eHs(n,3,0)),this.setAttribute("instanceEnd",new s.eHs(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new s.LuO(n,2*t,1);return this.setAttribute("instanceColorStart",new s.eHs(i,t,0)),this.setAttribute("instanceColorEnd",new s.eHs(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new s.XJ7(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new s.NRn);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),c.setFromBufferAttribute(t),this.boundingBox.union(c))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new s.iyt),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)u.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(u)),u.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var f=n(87548);let p=parseInt(s.sPf.replace(/\D+/g,""));class h extends s.BKk{constructor(e){super({type:"LineMaterial",uniforms:s.LlO.clone(s.LlO.merge([f.UniformsLib.common,f.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new s.I9Y(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${p>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let m=p>=125?"uv1":"uv2",v=new s.IUQ,y=new s.Pq0,b=new s.Pq0,g=new s.IUQ,w=new s.IUQ,x=new s.IUQ,E=new s.Pq0,S=new s.kn4,M=new s.cZY,A=new s.Pq0,P=new s.NRn,L=new s.iyt,O=new s.IUQ;function _(e,t,n){return O.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),O.multiplyScalar(1/O.w),O.x=r/n.width,O.y=r/n.height,O.applyMatrix4(e.projectionMatrixInverse),O.multiplyScalar(1/O.w),Math.abs(Math.max(O.x,O.y))}class k extends s.eaF{constructor(e=new d,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,r=0,o=t.count;e<o;e++,r+=2)y.fromBufferAttribute(t,e),b.fromBufferAttribute(n,e),i[r]=0===r?0:i[r-1],i[r+1]=i[r]+y.distanceTo(b);let r=new s.LuO(i,2,1);return e.setAttribute("instanceDistanceStart",new s.eHs(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.eHs(r,1,1)),this}raycast(e,t){let n,o,a=this.material.worldUnits,l=e.camera;null!==l||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let c=void 0!==e.params.Line2&&e.params.Line2.threshold||0;i=e.ray;let u=this.matrixWorld,d=this.geometry,f=this.material;if(r=f.linewidth+c,null===d.boundingSphere&&d.computeBoundingSphere(),L.copy(d.boundingSphere).applyMatrix4(u),a)n=.5*r;else{let e=Math.max(l.near,L.distanceToPoint(i.origin));n=_(l,e,f.resolution)}if(L.radius+=n,!1!==i.intersectsSphere(L)){if(null===d.boundingBox&&d.computeBoundingBox(),P.copy(d.boundingBox).applyMatrix4(u),a)o=.5*r;else{let e=Math.max(l.near,P.distanceToPoint(i.origin));o=_(l,e,f.resolution)}P.expandByScalar(o),!1!==i.intersectsBox(P)&&(a?function(e,t){let n=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,l=o.attributes.instanceEnd,c=Math.min(o.instanceCount,a.count);for(let o=0;o<c;o++){M.start.fromBufferAttribute(a,o),M.end.fromBufferAttribute(l,o),M.applyMatrix4(n);let c=new s.Pq0,u=new s.Pq0;i.distanceSqToSegment(M.start,M.end,u,c),u.distanceTo(c)<.5*r&&t.push({point:u,pointOnLine:c,distance:i.origin.distanceTo(u),object:e,face:null,faceIndex:o,uv:null,[m]:null})}}(this,t):function(e,t,n){let o=t.projectionMatrix,a=e.material.resolution,l=e.matrixWorld,c=e.geometry,u=c.attributes.instanceStart,d=c.attributes.instanceEnd,f=Math.min(c.instanceCount,u.count),p=-t.near;i.at(1,x),x.w=1,x.applyMatrix4(t.matrixWorldInverse),x.applyMatrix4(o),x.multiplyScalar(1/x.w),x.x*=a.x/2,x.y*=a.y/2,x.z=0,E.copy(x),S.multiplyMatrices(t.matrixWorldInverse,l);for(let t=0;t<f;t++){if(g.fromBufferAttribute(u,t),w.fromBufferAttribute(d,t),g.w=1,w.w=1,g.applyMatrix4(S),w.applyMatrix4(S),g.z>p&&w.z>p)continue;if(g.z>p){let e=g.z-w.z,t=(g.z-p)/e;g.lerp(w,t)}else if(w.z>p){let e=w.z-g.z,t=(w.z-p)/e;w.lerp(g,t)}g.applyMatrix4(o),w.applyMatrix4(o),g.multiplyScalar(1/g.w),w.multiplyScalar(1/w.w),g.x*=a.x/2,g.y*=a.y/2,w.x*=a.x/2,w.y*=a.y/2,M.start.copy(g),M.start.z=0,M.end.copy(w),M.end.z=0;let c=M.closestPointToPointParameter(E,!0);M.at(c,A);let f=s.cj9.lerp(g.z,w.z,c),h=f>=-1&&f<=1,v=E.distanceTo(A)<.5*r;if(h&&v){M.start.fromBufferAttribute(u,t),M.end.fromBufferAttribute(d,t),M.start.applyMatrix4(l),M.end.applyMatrix4(l);let r=new s.Pq0,o=new s.Pq0;i.distanceSqToSegment(M.start,M.end,o,r),n.push({point:o,pointOnLine:r,distance:i.origin.distanceTo(o),object:e,face:null,faceIndex:t,uv:null,[m]:null})}}}(this,l,t))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(v),this.material.uniforms.resolution.value.set(v.z,v.w))}}class z extends d{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5];else for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5],i[2*r+6]=e[r+6],i[2*r+7]=e[r+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class j extends k{constructor(e=new z,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let T=a.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:i,lineWidth:r,segments:c,dashed:u,...f},p){var m,v;let y=(0,l.C)(e=>e.size),b=a.useMemo(()=>c?new k:new j,[c]),[g]=a.useState(()=>new h),w=(null==n||null==(m=n[0])?void 0:m.length)===4?4:3,x=a.useMemo(()=>{let i=c?new d:new z,r=e.map(e=>{let t=Array.isArray(e);return e instanceof s.Pq0||e instanceof s.IUQ?[e.x,e.y,e.z]:e instanceof s.I9Y?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(r.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof s.Q1f?e.toArray():e);i.setColors(e.flat(),w)}return i},[e,c,n,w]);return a.useLayoutEffect(()=>{b.computeLineDistances()},[e,b]),a.useLayoutEffect(()=>{u?g.defines.USE_DASH="":delete g.defines.USE_DASH,g.needsUpdate=!0},[u,g]),a.useEffect(()=>()=>{x.dispose(),g.dispose()},[x]),a.createElement("primitive",(0,o.A)({object:b,ref:p},f),a.createElement("primitive",{object:x,attach:"geometry"}),a.createElement("primitive",(0,o.A)({object:g,attach:"material",color:t,vertexColors:!!n,resolution:[y.width,y.height],linewidth:null!=(v=null!=i?i:r)?v:1,dashed:u,transparent:4===w},f)))})},88945:(e,t,n)=>{n.d(t,{A:()=>i});function i(){return(i=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var i in n)({}).hasOwnProperty.call(n,i)&&(e[i]=n[i])}return e}).apply(null,arguments)}},91169:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},99708:(e,t,n)=>{n.d(t,{A:()=>i});let i=(0,n(71847).A)("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]])}}]);