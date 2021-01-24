import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Vector3, Group, Object3D, Camera, PerspectiveCamera, OrthographicCamera } from 'three'
import { Assign } from 'utility-types'
import { Canvas, ReactThreeFiber, useFrame, useThree } from 'react-three-fiber'

const v1 = new Vector3()
const v2 = new Vector3()
const v3 = new Vector3()
function calculatePosition(el, camera, size) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf]
}

function isObjectBehindCamera(el, camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
  const deltaCamObj = objectPos.sub(cameraPos)
  const camDir = camera.getWorldDirection(v3)
  return deltaCamObj.angleTo(camDir) > Math.PI / 2
}

function objectScale(el, camera) {
  if (camera instanceof PerspectiveCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const vFOV = (camera.fov * Math.PI) / 180
    const dist = objectPos.distanceTo(cameraPos)
    return 1 / (2 * Math.tan(vFOV / 2) * dist)
  }
  if (camera instanceof OrthographicCamera) return camera.zoom
  return 1
}

function objectZIndex(el, camera, zIndexRange) {
  if (camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const dist = objectPos.distanceTo(cameraPos)
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near)
    const B = zIndexRange[1] - A * camera.far
    return Math.round(A * dist + B)
  }
  return undefined
}

export const Html = React.forwardRef(
  (
    {
      children,
      eps = 0.001,
      style,
      className,
      prepend,
      center,
      fullscreen,
      portal,
      scaleFactor,
      zIndexRange = [16777271, 0],
      ...props
    },
    ref
  ) => {
    const { gl, scene, camera, size } = useThree()
    const [el] = React.useState(() => document.createElement('div'))
    const group = React.useRef(null)
    const old = React.useRef([0, 0])
    const target = portal?.current ?? gl.domElement.parentNode

    React.useEffect(() => {
      if (group.current) {
        scene.updateMatrixWorld()
        const vec = calculatePosition(group.current, camera, size)
        el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`
        if (target) {
          if (prepend) target.prepend(el)
          else target.appendChild(el)
        }
        return () => {
          if (target) target.removeChild(el)
          ReactDOM.unmountComponentAtNode(el)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target])

    const styles = React.useMemo(
      () => ({
        position: 'absolute',
        transform: center ? 'translate3d(-50%,-50%,0)' : 'none',
        ...(fullscreen && {
          top: -size.height / 2,
          left: -size.width / 2,
          width: size.width,
          height: size.height,
        }),
        ...style,
      }),
      [style, center, fullscreen, size]
    )

    React.useLayoutEffect(
      () => void ReactDOM.render(<div ref={ref} style={styles} className={className} children={children} />, el)
    )

    useFrame(() => {
      if (group.current) {
        camera.updateMatrixWorld()
        const vec = calculatePosition(group.current, camera, size)
        if (Math.abs(old.current[0] - vec[0]) > eps || Math.abs(old.current[1] - vec[1]) > eps) {
          el.style.display = !isObjectBehindCamera(group.current, camera) ? 'block' : 'none'
          const scale = scaleFactor === undefined ? 1 : objectScale(group.current, camera) * scaleFactor
          el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`
          el.style.zIndex = `${objectZIndex(group.current, camera, zIndexRange)}`
        }
        old.current = vec
      }
    })

    return <group {...props} ref={group} />
  }
)

const round = (n) => Math.round(n * 100) / 100

const Bug = () => {
  const ref = React.useRef()
  useFrame(({ mouse }) => {
    ref.current.innerText = `${round(mouse.x)}, ${round(mouse.y)}`
  })
  return (
    <Html>
      <div ref={ref}>Hello world</div>
    </Html>
  )
}

const Scene = () => {
  return (
    <Canvas>
      <Bug />
    </Canvas>
  )
}

export { Scene as Bug }
