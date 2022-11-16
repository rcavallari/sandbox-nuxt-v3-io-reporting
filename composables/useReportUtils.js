const useReportUtils = () => {
  return {
    getProduct: (idProduct, products) => {
      let price = -1
      let index = -1
      const product = products.find(
        (product) => product.idProduct === idProduct
      )
      if (!product) {
        console.log(
          `"error-getProduct": "missing product form product list: ${idProduct}`
        )
      }
      if (product && product.price !== undefined) {
        price = product.price
      }
      if (product && product['index_pd'] !== undefined) {
        index = product['index_pd']
      }
      return { price, index }
    },
    generateCsv: (scvRaw, products) => {
      const rawReport = []
      for (let i = 0; i < scvRaw.length; i++) {
        const user = {
          idSurvey: scvRaw[i].idSurvey,
          idMaster: scvRaw[i]['idmaster_data'],
          idCell: scvRaw[i].idCell,
          sales: [],
          clicks: [],
          views: [],
        }

        // view data
        // ------------
        const views =
          scvRaw[i]['view_data'] &&
          scvRaw[i]['view_data'].filter(
            (elem) => elem['idmaster_data'] === user.idMaster
          )
        for (let j = 0; j < views.length; j++) {
          const elem = views[j]
          const product = module.exports.getProduct(elem.idProduct, products)

          const entry = {
            idProduct: elem.idProduct,
            index: product.index,
            sequence: elem.sequence,
            timer: elem.timer,
            time: elem.time,
          }
          if (elem.timer >= 0.5 && product.index !== -1) user.views.push(entry)
        }
        // ------------

        // click data
        // ------------
        const clicks =
          scvRaw[i]['click_data'] &&
          scvRaw[i]['click_data'].filter(
            (elem) => elem['idmaster_data'] === user.idMaster
          )
        for (let j = 0; j < clicks.length; j++) {
          const elem = clicks[j]
          const product = module.exports.getProduct(elem.idProduct, products)

          const entry = {
            idProduct: elem.idProduct,
            index: product.index,
            sequence: elem.sequence,
            time: elem.time,
          }

          // IF Click is NOT in View array add it with std values
          if (!user.views.find((entry) => entry.idProduct === elem.idProduct)) {
            const entry = {
              idProduct: elem.idProduct,
              index: product.index,
              sequence: user.views.length > 0 ? user.views.length + 1 : 1,
              timer: 0.5,
              time:
                user.views.length > 0
                  ? user.views[user.views.length - 1].time + 1.5
                  : 1.5,
            }
            if (product.index !== -1) user.views.push(entry)
          }

          if (product.index !== -1) user.clicks.push(entry)
        }
        // ------------

        // sales data
        //  -----------
        const sales =
          scvRaw[i]['sales_data'] &&
          scvRaw[i]['sales_data'].filter(
            (elem) => elem['idmaster_data'] === user.idMaster
          )
        for (let j = 0; j < sales.length; j++) {
          const elem = sales[j]
          const product = module.exports.getProduct(elem.idProduct, products)

          const entry = {
            idProduct: elem.idProduct,
            index: product.index,
            sequence: elem.sequence,
            quantity: elem.quantity,
            price: elem.price,
          }

          // IF Sales is NOT in Click array add it with std values
          if (
            !user.clicks.find((entry) => entry.idProduct === elem.idProduct)
          ) {
            const entry = {
              idProduct: elem.idProduct,
              index: product.index,
              sequence: user.clicks.length > 0 ? user.clicks.length + 1 : 1,
              time:
                user.clicks.length > 0
                  ? user.clicks[user.clicks.length - 1].time + 1
                  : 1,
            }
            if (product.index !== -1) user.clicks.push(entry)
          }

          user.sales.push(entry)
        }
        // ------------

        // states timers
        const timers = scvRaw[i]['states_timers']
        const filters = [
          'confirmation',
          'end',
          'menu',
          'start',
          'uiHelp',
          'help',
          'mission',
        ]
        const filterTimers = timers.filter((elem) => {
          if (filters.includes(elem.state)) {
            return false
          } else return true
        })
        const totalTime = timers.reduce((previous, current) => {
          return previous + current.timer
        }, 0)
        const shoppingTime = filterTimers.reduce((previous, current) => {
          return previous + current.timer
        }, 0)
        user.timers = {
          totalTime: parseFloat(totalTime.toFixed(4)),
          shoppingTime: parseFloat(shoppingTime.toFixed(4)),
        }
        // ------------

        rawReport.push(user)
      }
      return rawReport
    },
    generateFindability: (targets, scvRaw) => {
      const findData = []
      for (let i = 0; i < scvRaw.length; i++) {
        const userRaw = scvRaw[i]
        const userFind = {
          idMaster: userRaw['idmaster_data'],
          idSurvey: userRaw['idSurvey'],
          idCell: userRaw['idCell'],
          findParam: new URLSearchParams(userRaw['ext_params']).get('find'),
        }
        const targetData = targets.find(
          (elem) =>
            elem['find_parameter'] === userFind.findParam &&
            userFind.idCell.includes(elem.idCell)
        )
        if (!targetData)
          throw `error missing target data: ${JSON.stringify(
            targetData
          )} target data; ${JSON.stringify(userFind)} user`

        const sales = userRaw['sales_data']
        const clicks = userRaw['click_data']
        const timers = userRaw['states_timers']
        const timerStates = timers.find((elem) => elem.state === 'navigation')

        userFind.timerSates = timerStates && timerStates.timer

        if (sales.length > 0) {
          const selected = sales.find((p) => p.sequence === 1)
          if (!selected)
            throw `error sequence or element missing sales find: ${JSON.stringify(
              sales
            )}`
          userFind.selected = selected.idProduct
          userFind.timerRaw = selected.time
        } else if (clicks.length > 0) {
          const selected = clicks[clicks.length - 1]
          if (!selected)
            throw `error sequence or element missing clicks find: ${JSON.stringify(
              clicks
            )}`
          userFind.selected = selected.idProduct
          userFind.timerRaw = selected.time
        } else {
          userFind.selected = 'no selection'
          userFind.timerRaw = userFind.timerSates
        }

        let targetIds = targetData.idProduct.split(';')
        targetIds = targetIds.map((target) => target.trim())
        let validator = false

        for (let j = 0; j < targetIds.length; j++) {
          if (targetIds[j].toString() === userFind.selected.toString()) {
            validator = true
            break
          }
        }
        userFind.validator = validator
        userFind.targets = targetIds.join(';')

        findData.push(userFind)
      }

      return findData
    },
    validateIndex: (products) => {
      products = products.sort((a, b) => a['index_pd'] - b['index_pd'])
      // Number of element must be equal to last index
      const maxIndex = useMaxBy(products, 'index_pd')['index_pd']
      const elementsVsIndex = maxIndex === products.length
      if (!elementsVsIndex) return false

      for (let i = 0; i < products.length; i++) {
        if (i + 1 !== products[i]['index_pd']) {
          return false
        }
      }
      return true
    },
    validateDirectory: (idProject) => {
      const outputDir = path.join('output', idProject)
      const inputDir = path.join('input', idProject)
      if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir)
      }
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
      }
    },
    updateIndexes: (products) => {
      products = products.sort(
        (a, b) =>
          a.description.localeCompare(b.description) ||
          a.idProduct - b.idProduct
      )

      for (let i = 0; i < products.length; i++) {
        products[i].index_pd = i + 1
      }

      return products
    },
    generateHmData: (products, scv) => {
      let cells = []
      const baseHeatmapProducts = products.map((product) => {
        product.sales = 0
        product.clicks = 0
        product.views = 0
        cells = [...cells, ...product.cells.split(',')]
        return { ...product }
      })

      cells = [...new Set(cells)]
      const productsHeatMaps = []

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        for (let j = 0; j < baseHeatmapProducts.length; j++) {
          const product = baseHeatmapProducts[j]
          product.idCell = cell
          if (product.cells.includes(cell))
            productsHeatMaps.push({ ...product })
        }
      }

      fs.writeFileSync(
        path.join('output', 'heatmapProduct.json'),
        JSON.stringify(productsHeatMaps)
      )

      for (let i = 0; i < scv.length; i++) {
        const user = scv[i]
        const sales = scv[i]['sales']
        const clicks = scv[i]['clicks']
        const views = scv[i]['views']

        // Sales Data
        for (let j = 0; j < sales.length; j++) {
          const sale = sales[j]
          const product = productsHeatMaps.find(
            (p) => p.index_pd === sale.index && p.idCell === user.idCell
          )

          if (!product)
            throw `missing product in list sales: ${sale.index} index ${user.idCell} cell`

          product.idCell = user.idCell
          product.sales += 1
        }

        // Click data
        for (let j = 0; j < clicks.length; j++) {
          const click = clicks[j]
          const product = productsHeatMaps.find(
            (p) => p.index_pd === click.index && p.idCell === user.idCell
          )

          if (!product)
            throw `missing product in list clicks: ${click.index} index ${user.idCell} cell`

          product.idCell = user.idCell
          product.clicks += 1
        }

        // Views data
        for (let j = 0; j < views.length; j++) {
          const view = views[j]
          const product = productsHeatMaps.find(
            (p) => p.index_pd === view.index && p.idCell === user.idCell
          )

          if (!product)
            throw `missing product in list views: ${view.index} index ${user.idCell} cell`

          product.idCell = user.idCell
          if (view.timer >= 0.49999) product.views += 1
        }
      }

      return productsHeatMaps
    },
  }
}

export default useReportUtils
