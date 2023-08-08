
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;


void main(){
 
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //  + modelPosition.x*50.0 - adds randomness on cycle based on x position
    modelPosition.y +=  sin(uTime + modelPosition.x*50.0 )*aScale*0.2; 


    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0/-viewPosition.z);  // This is hard coded from built in shader to achieve size atenuation

}
