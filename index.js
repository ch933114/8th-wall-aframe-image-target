  // ── 設定兩個 image target ──────────────────────────────────────
      // target 1：拍到此圖顯示 jellyfish 3D 模型
      const JELLYFISH_TARGET = 'bmo-bites'

      // target 2：拍到此圖顯示影片（請換成你實際的 target 名稱）
      const CAT_TARGET = 'cat_img_target'

      // 兩個 target 的 JSON 路徑（可以是同一個檔案，也可以分開）
      const targetJsonPaths = [
        'image-targets/bmo-bites.json',
        'image-targets/cat_img_target.json',   // ← 換成你實際的路徑
      ]
      // ─────────────────────────────────────────────────────────────

      const applyImageTargetPose = (entity, detail) => {
        const object3D = entity.object3D
        const {position, rotation, scale} = detail
        object3D.position.set(position.x, position.y, position.z)
        object3D.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
        object3D.scale.set(scale, scale, scale)
      }

      const imageTargetPipelineModule = () => {
        let jellyfish = null
        let catAnchor = null
        let catVideo = null

        const showTarget = ({detail}) => {
          if (!detail) return

          if (detail.name === JELLYFISH_TARGET && jellyfish) {
            applyImageTargetPose(jellyfish, detail)
            jellyfish.setAttribute('visible', true)
          }

          if (detail.name === CAT_TARGET && catAnchor) {
            applyImageTargetPose(catAnchor, detail)
            catAnchor.setAttribute('visible', true)
            catVideo && catVideo.play()
          }
        }

        const hideTarget = ({detail}) => {
          if (!detail) return

          if (detail.name === JELLYFISH_TARGET && jellyfish) {
            jellyfish.setAttribute('visible', false)
          }

          if (detail.name === CAT_TARGET && catAnchor) {
            catAnchor.setAttribute('visible', false)
            catVideo && catVideo.pause()
          }
        }

        return {
          name: 'aframe-image-target',
          onStart: () => {
            jellyfish = document.querySelector('#jellyfish-anchor')
            catAnchor = document.querySelector('#cat-anchor')
            catVideo = document.querySelector('#cat-video')

            if (jellyfish) jellyfish.setAttribute('visible', false)
            if (catAnchor) catAnchor.setAttribute('visible', false)
          },
          listeners: [
            {event: 'reality.imagefound',   process: showTarget},
            {event: 'reality.imageupdated', process: showTarget},
            {event: 'reality.imagelost',    process: hideTarget},
          ],
        }
      }

      const loadImageTargets = async () => {
        const allTargetData = await Promise.all(
          targetJsonPaths.map(async (path) => {
            const response = await fetch(path)
            if (!response.ok) {
              throw new Error(`Failed to load image target: ${path}`)
            }
            return response.json()
          })
        )

        XR8.XrController.configure({
          imageTargetData: allTargetData,
        })
      }

      window.addEventListener('xrloaded', async () => {
        try {
          XR8.addCameraPipelineModule(imageTargetPipelineModule())
          await loadImageTargets()
        } catch (error) {
          console.error(error)
        }
      })