import { Injectable } from '@angular/core';

import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  DirectionalLight,
  GridHelper,
  Mesh,
  Raycaster,
  Vector3,
  BoxBufferGeometry,
  MeshBasicMaterial,
  Vector2,
  DoubleSide
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  private rayCaster = new Raycaster();
  private mouseVector = new Vector3();
  private loader = new GLTFLoader();
  private controls: OrbitControls;
  private renderer = new WebGLRenderer({
    antialias: true
  });
  private grid = new GridHelper(100, 500);
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private light = new DirectionalLight(0xffffff);

  constructor() {
    this.renderer.setClearColor(0xeeeeee);
    this.light.position.set(-1, 1, 2).normalize();
    this.scene.add(this.light);
    //this.scene.add(this.grid);
    this.addDefaultCabinet();
    window.addEventListener(
      'mousemove',
      event => this.onMouseMove(event),
      false
    );
  }

  get cabinet(): Mesh | undefined {
    return this.scene.getObjectByName('Cabinet') as Mesh;
  }

  attachThreeToDom(element: HTMLElement) {
    this.camera = new PerspectiveCamera(75, null, 0.1, 1000);
    this.updateRendererSize(element.offsetWidth, element.offsetHeight);
    element.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.camera.position.set(0.5, 1.5, 2.25);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.animate();
  }

  updateRendererSize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.rayCaster.setFromCamera(this.mouseVector, this.camera);
    const meshes = [];
    for (let i = 0; i < this.scene.children.length; i++) {
      if (this.scene.children[i] instanceof Mesh) {
        meshes.push(this.scene.children[i]);
      }
    }
    const intersects = this.rayCaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      // TODO: handle highlighting object
    }
    this.renderer.render(this.scene, this.camera);
  }

  addDefaultCabinet() {
    this.loader.load(
      '../../../../assets/objects/generic_cabinet.gltf',
      obj => {
        const cabinet = obj.scene.children[0] as Mesh;
        cabinet.name = 'Cabinet';
        this.scene.add(cabinet);
        const testGeo = new BoxBufferGeometry(0.4826, 0.0889, 0.75);
        const testMaterial = new MeshBasicMaterial({
          color: 0x345654,
          side: DoubleSide
        });
        const testMesh = new Mesh(testGeo, testMaterial);
        this.scene.add(testMesh);
        testMesh.position.set(0, 1.7, 0.14);
      },
      null,
      console.log
    );
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();
    this.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseVector.y = (event.clientY / window.innerHeight) * 2 + 1;
    this.mouseVector.z = 1;
  }
}
