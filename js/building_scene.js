                        var scene_list = [];
                        var renderer_list = [];
                        var current_id = 0;
                        var controls = [];
                        var cameras = [];
                        var stl_list = [];
                        
                        var pointLight = new THREE.PointLight(0xffffff, 0.3);
			var directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
			var ambientLight = new THREE.AmbientLight(0x202020);
	
                        function init_one_by_one(stl_geo) {
                                renderer_list.push(new THREE.WebGLRenderer());
                                scene_list.push(new THREE.Scene());
                            
                                var material=new THREE.MeshLambertMaterial({color:0x909090, overdraw: 1, wireframe: false, shading:THREE.FlatShading, vertexColors: THREE.FaceColors});

                                mesh = new THREE.Mesh( stl_geo, material );
				scene_list[current_id].add( mesh );
                                
                                directionalLight.position.x = stl_geo.boundingBox.min.y * 2;
				directionalLight.position.y = stl_geo.boundingBox.min.y * 2;
				directionalLight.position.z = stl_geo.boundingBox.max.z * 2;

				pointLight.position.x = (stl_geo.boundingBox.min.y+stl_geo.boundingBox.max.y)/2;
				pointLight.position.y = (stl_geo.boundingBox.min.y+stl_geo.boundingBox.max.y)/2;
				pointLight.position.z = stl_geo.boundingBox.max.z * 2;
                 
				renderer_list[current_id] = new THREE.WebGLRenderer({ preserveDrawingBuffer:true, alpha:true });

				renderer_list[current_id].setSize( 464, 464 );
                                
				document.getElementById('canvas_container_'+(current_id+1)).appendChild( renderer_list[current_id].domElement );    
                                
                                cameras.push(new THREE.PerspectiveCamera(45, 1, 0.1, 10000));
                                cameras[current_id].position.set(0,0,100);  
                                                
                                scene_list[current_id].add(cameras[current_id]);
	
                                ambientLight = new THREE.AmbientLight(0x202020);
                                cameras[current_id].add(ambientLight);


                                directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
                                directionalLight.position.x = 1;
                                directionalLight.position.y = 1;
                                directionalLight.position.z = 2;
                                directionalLight.position.normalize();

                                cameras[current_id].add(directionalLight);



                                pointLight = new THREE.PointLight(0xffffff, 0.3);
                                pointLight.position.x = 0;
                                pointLight.position.y = -25;
                                pointLight.position.z = 10;
                                cameras[current_id].add(pointLight);	
                                                
                                controls.push(new THREE.OrbitControls(cameras[current_id], renderer_list[current_id].domElement));
                                controls[current_id].autoRotate=true;
                        }
                        
                        function animate_one_by_one() {
                                
                                requestAnimationFrame( animate_one_by_one );

                                for(var i=0; i < current_id; i++) {
                                    controls[i].update();
                                    renderer_list[i].render( scene_list[i], cameras[i] );
                                }
                                
                              

			}

                        function after_file_load(filename, s)
			{
				var vf_data;
				
				try
				{
					vf_data=parse_3d_file(filename, s);
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
				
				mesh_is_ready=false;
				
                                //pour le 1er
				var geo=new THREE.Geometry;
				geo.vertices=vf_data.vertices;
				geo.faces=vf_data.faces;				
				geo.computeBoundingBox();
					
				//geo.computeCentroids();
				geo.computeFaceNormals();
				geo.computeVertexNormals();
				THREE.GeometryUtils.center(geo);
				
                                return geo;
                                
				
			}
                        
                        function read_file(f)
                        {   
                                var reader = new FileReader();

                                 reader.onprogress = function(e)
                                {
                                  /*  var val =e.loaded / e.total*100;
                                    document.getElementById("loading").innerHTML = val+"%";    
                                    */
                                   document.getElementById("loading_"+(current_id+1)).innerHTML = "Processing 3D in browser ..";  
                                }
                       
                                reader.onload = function(e)
                                {
                                    document.getElementById("loading_"+(current_id+1)).remove();
                                    init_one_by_one(after_file_load(f.name, e.target.result));                               
                                    current_id++;    
                                    
                                    if (stl_list[current_id] != null) {
                                        go(stl_list[current_id]);
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
                                        read_file(new File([myBlob], url, { type: "application/octet-binary", lastModified: Date.now() }));
                                        animate_one_by_one();
                                    }
                                };
                                xhr.send();  
                        }
                        