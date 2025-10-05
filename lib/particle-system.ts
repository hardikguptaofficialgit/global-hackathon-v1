import * as THREE from "three"

interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  lifetime: number
  maxLifetime: number
}

export class ParticleSystem {
  private scene: THREE.Scene
  private particles: Particle[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  createCookingEffect(position: THREE.Vector3) {
    // Steam particles
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.copy(position)
      mesh.position.x += (Math.random() - 0.5) * 0.5
      mesh.position.z += (Math.random() - 0.5) * 0.5

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.5 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.3,
      )

      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity,
        lifetime: 0,
        maxLifetime: 2 + Math.random() * 2,
      })
    }

    // Sparkle particles
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.SphereGeometry(0.03, 6, 6)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8,
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.copy(position)
      mesh.position.x += (Math.random() - 0.5) * 0.8
      mesh.position.y += Math.random() * 0.3
      mesh.position.z += (Math.random() - 0.5) * 0.8

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0.3 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5,
      )

      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity,
        lifetime: 0,
        maxLifetime: 1 + Math.random(),
      })
    }
  }

  createSuccessEffect(position: THREE.Vector3) {
    // Success sparkles
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.SphereGeometry(0.04, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.6),
        transparent: true,
        opacity: 1,
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.copy(position)

      const angle = (i / 30) * Math.PI * 2
      const speed = 1 + Math.random() * 2
      const velocity = new THREE.Vector3(Math.cos(angle) * speed, 1 + Math.random() * 2, Math.sin(angle) * speed)

      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity,
        lifetime: 0,
        maxLifetime: 1.5 + Math.random(),
      })
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.lifetime += delta

      if (particle.lifetime >= particle.maxLifetime) {
        this.scene.remove(particle.mesh)
        particle.mesh.geometry.dispose()
        ;(particle.mesh.material as THREE.Material).dispose()
        this.particles.splice(i, 1)
        continue
      }

      // Update position
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta))

      // Apply gravity and drag
      particle.velocity.y -= 0.5 * delta
      particle.velocity.multiplyScalar(0.98)

      // Fade out
      const progress = particle.lifetime / particle.maxLifetime
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.opacity = 1 - progress

      // Scale up steam particles
      if (material.color.getHex() === 0xffffff) {
        const scale = 1 + progress * 2
        particle.mesh.scale.set(scale, scale, scale)
      }
    }
  }
}
