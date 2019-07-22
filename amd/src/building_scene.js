/*eslint-disable */var controls = [];/*eslint-enable */
define(['filter_viewermecaobj/three','filter_viewermecaobj/parser','filter_viewermecaobj/OrbitControls'],
function(THREE, Parser, /*eslint-disable */OrbitControls/*eslint-enable */) {
    var scene_list = [];
    var renderer_list = [];
    var current_id = 0;
    var cameras = [];
    var stl_list = [];
    var firstime = true;
    var very_firstime = true;
    var local_controls = [];
    var pointLight = new THREE.PointLight(0xffffff, 0.3);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    var ambientLight = new THREE.AmbientLight(0x202020);

    function init_one_by_one(stl_geo) {
        var scene = new THREE.Scene();

        var material = new THREE.MeshPhongMaterial({
            color: 0x909090,
            shading: THREE.FlatShading
        });

        var mesh = new THREE.Mesh( stl_geo, material );
        scene.add( mesh );

        directionalLight.position.x = stl_geo.boundingBox.min.y * 2;
        directionalLight.position.y = stl_geo.boundingBox.min.y * 2;
        directionalLight.position.z = stl_geo.boundingBox.max.z * 2;
        pointLight.position.x = (stl_geo.boundingBox.min.y+stl_geo.boundingBox.max.y)/2;
        pointLight.position.y = (stl_geo.boundingBox.min.y+stl_geo.boundingBox.max.y)/2;
        pointLight.position.z = stl_geo.boundingBox.max.z * 2;

        var renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer:true, alpha:true });
        renderer.setSize( 464, 464 );

            var ident;
            if (stl_list[current_id][2] > 1) {
                ident = 'canvas_container_'+(current_id+1)+"_"+stl_list[current_id][1]+"_"+stl_list[current_id][3];
            } else {
                ident = 'canvas_container_1_'+stl_list[current_id][1]+"_"+stl_list[current_id][3];
            }

            var dom = renderer.domElement;
            document.getElementById(ident)
                .appendChild( dom );

        var cam = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
        cam.position.set(0,0,100);
        scene.add(cam);
        scene_list.push(scene);
        ambientLight = new THREE.AmbientLight(0x202020);
        cam.add(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
        directionalLight.position.x = 1;
        directionalLight.position.y = 1;
        directionalLight.position.z = 2;
        directionalLight.position.normalize();

        cam.add(directionalLight);

        pointLight = new THREE.PointLight(0xffffff, 0.3);
        pointLight.position.x = 0;
        pointLight.position.y = -25;
        pointLight.position.z = 10;
        cam.add(pointLight);
        cameras.push(cam);

        renderer_list.push(renderer);

        var OrbitControls = new THREE.OrbitControls(cam, dom);
        OrbitControls.autoRotate=true;
        OrbitControls .ident=ident;
        local_controls.push(OrbitControls);
    }

    function animate_one_by_one() {
        requestAnimationFrame( animate_one_by_one );

        if (local_controls !== controls) {
            controls =  local_controls;
        }

        for(var i=0; i < current_id; i++) {
            if (typeof controls[i] !== "undefined" && typeof renderer_list[i] !== "undefined") {
                controls[i].update();
                renderer_list[i].render( scene_list[i], cameras[i] );
            }
        }
    }

    function after_file_load(filename, s)
    {
        var vf_data;

        try
        {
            /*eslint-disable */vf_data=parse_3d_file(filename, s);/*eslint-enable */
        }
        catch(err)
        {
            vf_data="Error parsing the file";
        }

        if (typeof vf_data === 'string')
        {
            alert(vf_data);
            return;
        }

        //mesh_is_ready=false;
        var geo=new THREE.Geometry;
        geo.vertices=vf_data.vertices;
        geo.faces=vf_data.faces;
        geo.computeBoundingBox();
        geo.computeFaceNormals();
        geo.computeVertexNormals();
        THREE.GeometryUtils.center(geo);

        return geo;
    }

    function read_file(f)
    {
        var id_loading;
        if (stl_list[current_id][2] > 1) {
            id_loading = 'loading_'+(current_id+1)+"_"+stl_list[current_id][1]+"_"+stl_list[current_id][3];
        } else {
            id_loading = 'loading_1_'+stl_list[current_id][1]+"_"+stl_list[current_id][3];
        }

        var reader = new FileReader();
        reader.onprogress = function()
        {
            document.getElementById(id_loading).innerHTML = "Processing 3D in browser ..";
        };

        reader.onload = function(e)
        {
            document.getElementById(id_loading).remove();
            init_one_by_one(after_file_load(f.name, e.target.result));
            current_id++;
            //Animate after read the file
            animate_one_by_one();
            if (typeof stl_list[current_id] !== "undefined") {
                go(stl_list[current_id][0]);
            }
        };
        reader.readAsArrayBuffer(f);
    }

    function go(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = function() {
            if (this.status == 200) {
                var myBlob = this.response;
                read_file(new File([myBlob], url,
                { type: "application/octet-binary", lastModified: Date.now() }));
            }
        };
        xhr.send();
    }

    return {
        init: function(urls, context_id,size,incr) {
            if(very_firstime == true) {
                //Make Sure we Reset ALL 
                stl_list = [];
                controls = [];
                current_id = 0;
                very_firstime = false;
            }

            urls.forEach(function(item){
                stl_list.push([item, context_id,size,incr]);
            });

            if(firstime == true) {
                go(stl_list[0][0]);
                firstime = false;
            }
        }
    };
});