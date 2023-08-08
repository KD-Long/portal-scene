


void main(){

    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05/ distanceToCenter - 0.1;

    gl_FragColor = vec4(1,1,1,strength); //gl_PointCoord is the uv coordinates of the x and y value imagining the point as a plane

}

