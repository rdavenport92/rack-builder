import { Injectable } from '@angular/core';

import {
  Scene,
  AmbientLight,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh
} from 'three';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  private renderer = new WebGLRenderer();
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private light = new AmbientLight();
  constructor() {
    this.scene.add(this.light);
    this.addObject();
  }

  attachThreeToDom(element: HTMLElement) {
    this.renderer.setSize(element.offsetWidth, element.offsetHeight, false);
    element.appendChild(this.renderer.domElement);
    this.camera = new PerspectiveCamera(
      75,
      element.offsetWidth / element.offsetHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
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
    this.renderer.render(this.scene, this.camera);
  }

  addObject() {
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0xffffff });
    const cube = new Mesh(geometry, material);
    this.scene.add(cube);
  }
}
