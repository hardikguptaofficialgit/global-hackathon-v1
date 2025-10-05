import * as THREE from "three"

export interface AnimationConfig {
  duration: number
  easing: "linear" | "easeInOut" | "easeIn" | "easeOut" | "bounce"
  delay?: number
  loop?: boolean
}

export interface TransitionState {
  from: THREE.Vector3
  to: THREE.Vector3
  progress: number
  config: AnimationConfig
  startTime: number
}

export class SmoothGameplayController {
  private transitions: Map<string, TransitionState> = new Map()
  private animations: Map<string, any> = new Map()
  private onTransitionComplete?: (id: string) => void

  constructor(onTransitionComplete?: (id: string) => void) {
    this.onTransitionComplete = onTransitionComplete
  }

  // Smooth position transitions
  startPositionTransition(
    id: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    config: AnimationConfig
  ) {
    const transition: TransitionState = {
      from: from.clone(),
      to: to.clone(),
      progress: 0,
      config,
      startTime: Date.now()
    }

    this.transitions.set(id, transition)
  }

  updatePositionTransition(id: string, deltaTime: number): THREE.Vector3 | null {
    const transition = this.transitions.get(id)
    if (!transition) return null

    const elapsed = Date.now() - transition.startTime
    const normalizedTime = Math.min(elapsed / transition.config.duration, 1)
    
    const easedTime = this.applyEasing(normalizedTime, transition.config.easing)
    
    const currentPos = new THREE.Vector3().lerpVectors(
      transition.from,
      transition.to,
      easedTime
    )

    if (normalizedTime >= 1) {
      this.transitions.delete(id)
      if (this.onTransitionComplete) {
        this.onTransitionComplete(id)
      }
    }

    return currentPos
  }

  // Smooth camera transitions
  startCameraTransition(
    camera: THREE.Camera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    config: AnimationConfig
  ) {
    const id = "camera_transition"
    const fromPosition = camera.position.clone()
    const fromLookAt = new THREE.Vector3()
    camera.getWorldDirection(fromLookAt)
    fromLookAt.add(camera.position)

    const transition: TransitionState = {
      from: fromPosition,
      to: targetPosition,
      progress: 0,
      config,
      startTime: Date.now()
    }

    this.transitions.set(id, transition)
    this.animations.set("camera_lookAt", {
      from: fromLookAt,
      to: targetLookAt,
      config,
      startTime: Date.now()
    })
  }

  updateCameraTransition(camera: THREE.Camera, deltaTime: number): boolean {
    const transition = this.transitions.get("camera_transition")
    const lookAtAnim = this.animations.get("camera_lookAt")
    
    if (!transition || !lookAtAnim) return false

    const elapsed = Date.now() - transition.startTime
    const normalizedTime = Math.min(elapsed / transition.config.duration, 1)
    
    const easedTime = this.applyEasing(normalizedTime, transition.config.easing)
    
    // Update position
    camera.position.lerpVectors(transition.from, transition.to, easedTime)
    
    // Update look-at
    const currentLookAt = new THREE.Vector3().lerpVectors(
      lookAtAnim.from,
      lookAtAnim.to,
      easedTime
    )
    camera.lookAt(currentLookAt)

    if (normalizedTime >= 1) {
      this.transitions.delete("camera_transition")
      this.animations.delete("camera_lookAt")
      if (this.onTransitionComplete) {
        this.onTransitionComplete("camera_transition")
      }
      return true
    }

    return false
  }

  // Smooth NPC movement with pathfinding
  startNPCMovement(
    npcId: string,
    waypoints: THREE.Vector3[],
    config: AnimationConfig
  ) {
    if (waypoints.length < 2) return

    let currentWaypoint = 0
    const startPos = waypoints[0]
    const endPos = waypoints[1]

    const transition: TransitionState = {
      from: startPos.clone(),
      to: endPos.clone(),
      progress: 0,
      config,
      startTime: Date.now()
    }

    this.transitions.set(npcId, transition)
    this.animations.set(`${npcId}_waypoints`, {
      waypoints,
      currentWaypoint: 1,
      totalWaypoints: waypoints.length
    })
  }

  updateNPCMovement(npcId: string, deltaTime: number): THREE.Vector3 | null {
    const transition = this.transitions.get(npcId)
    const waypointData = this.animations.get(`${npcId}_waypoints`)
    
    if (!transition || !waypointData) return null

    const elapsed = Date.now() - transition.startTime
    const normalizedTime = Math.min(elapsed / transition.config.duration, 1)
    
    const easedTime = this.applyEasing(normalizedTime, transition.config.easing)
    
    const currentPos = new THREE.Vector3().lerpVectors(
      transition.from,
      transition.to,
      easedTime
    )

    if (normalizedTime >= 1) {
      // Move to next waypoint
      if (waypointData.currentWaypoint < waypointData.totalWaypoints) {
        const nextWaypoint = waypointData.currentWaypoint
        transition.from.copy(transition.to)
        transition.to.copy(waypointData.waypoints[nextWaypoint])
        transition.startTime = Date.now()
        waypointData.currentWaypoint++
      } else {
        // Movement complete
        this.transitions.delete(npcId)
        this.animations.delete(`${npcId}_waypoints`)
        if (this.onTransitionComplete) {
          this.onTransitionComplete(npcId)
        }
      }
    }

    return currentPos
  }

  // Smooth UI transitions
  startUITransition(
    elementId: string,
    fromOpacity: number,
    toOpacity: number,
    config: AnimationConfig
  ) {
    const element = document.getElementById(elementId)
    if (!element) return

    const transition = {
      from: fromOpacity,
      to: toOpacity,
      progress: 0,
      config,
      startTime: Date.now(),
      element
    }

    this.animations.set(elementId, transition)
  }

  updateUITransition(elementId: string, deltaTime: number): boolean {
    const transition = this.animations.get(elementId)
    if (!transition) return false

    const elapsed = Date.now() - transition.startTime
    const normalizedTime = Math.min(elapsed / transition.config.duration, 1)
    
    const easedTime = this.applyEasing(normalizedTime, transition.config.easing)
    
    const currentOpacity = transition.from + (transition.to - transition.from) * easedTime
    transition.element.style.opacity = currentOpacity.toString()

    if (normalizedTime >= 1) {
      this.animations.delete(elementId)
      return true
    }

    return false
  }

  // Smooth dialogue bubble animations
  animateDialogueBubble(
    bubbleId: string,
    fromScale: number,
    toScale: number,
    config: AnimationConfig
  ) {
    const transition = {
      from: fromScale,
      to: toScale,
      progress: 0,
      config,
      startTime: Date.now(),
      bubbleId
    }

    this.animations.set(bubbleId, transition)
  }

  updateDialogueBubble(bubbleId: string, deltaTime: number): number | null {
    const transition = this.animations.get(bubbleId)
    if (!transition) return null

    const elapsed = Date.now() - transition.startTime
    const normalizedTime = Math.min(elapsed / transition.config.duration, 1)
    
    const easedTime = this.applyEasing(normalizedTime, transition.config.easing)
    
    const currentScale = transition.from + (transition.to - transition.from) * easedTime

    if (normalizedTime >= 1) {
      this.animations.delete(bubbleId)
    }

    return currentScale
  }

  // Easing functions
  private applyEasing(t: number, easing: AnimationConfig["easing"]): number {
    switch (easing) {
      case "linear":
        return t
      case "easeInOut":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      case "easeIn":
        return t * t
      case "easeOut":
        return t * (2 - t)
      case "bounce":
        if (t < 1 / 2.75) {
          return 7.5625 * t * t
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
        }
      default:
        return t
    }
  }

  // Update all active animations
  update(deltaTime: number) {
    // Update position transitions
    for (const [id] of this.transitions) {
      this.updatePositionTransition(id, deltaTime)
    }

    // Update UI transitions
    for (const [id] of this.animations) {
      if (id.includes("ui_")) {
        this.updateUITransition(id, deltaTime)
      } else if (id.includes("bubble_")) {
        this.updateDialogueBubble(id, deltaTime)
      }
    }
  }

  // Cleanup
  clearAllAnimations() {
    this.transitions.clear()
    this.animations.clear()
  }

  clearAnimation(id: string) {
    this.transitions.delete(id)
    this.animations.delete(id)
  }

  // Utility methods
  isTransitionActive(id: string): boolean {
    return this.transitions.has(id) || this.animations.has(id)
  }

  getTransitionProgress(id: string): number {
    const transition = this.transitions.get(id)
    if (!transition) return 0

    const elapsed = Date.now() - transition.startTime
    return Math.min(elapsed / transition.config.duration, 1)
  }
}
