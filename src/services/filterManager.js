import _ from 'lodash'

class FilterManager {
  load(index, collection, store) {
    if (!index || !collection) {
      throw new Error(
        'Cannot load filters if no index or collection are specfied'
      )
    }
    console.log('Loading filters...')

    let loadedFilterRoute = this.loadFromRoute(store)
    let loadedFilterLS = this.loadFromLocalStorage(index, collection)

    // We merge the two filters giving priority to the ones read from
    // the route.
    let loadedFilter = Object.assign(
      new Filter(),
      loadedFilterLS,
      loadedFilterRoute
    )

    return loadedFilter
  }

  loadFromRoute(store) {
    let filter = Object.assign({}, store.state.route.query)

    if (filter.raw && typeof filter.raw === 'string') {
      filter.raw = JSON.parse(filter.raw)
    }
    if (filter.sorting && typeof filter.sorting === 'string') {
      filter.sorting = JSON.parse(filter.sorting)
    }
    if (filter.basic && typeof filter.basic === 'string') {
      filter.basic = JSON.parse(filter.basic)
    }

    console.log('filters found in route')
    console.log(filter)

    return filter
  }

  loadFromLocalStorage(index, collection) {
    if (!index || !collection) {
      throw new Error(
        'Cannot load filters from localstorage if no index or collection are specfied'
      )
    }
    const filterStr = localStorage.getItem(
      `search-filter-current:${index}/${collection}`
    )
    if (filterStr) {
      return JSON.parse(filterStr)
    }

    return new Filter()
  }

  save(filter, router, index, collection) {
    if (!index || !collection) {
      throw new Error(
        'Cannot save filters if no index or collection are specfied'
      )
    }
    const strippedFilter = stripDefaultValuesFromFilter(filter)
    console.log('stripped filter to be saved...')
    console.log(strippedFilter)
    this.saveToRouter(strippedFilter, router)
    this.saveToLocalStorage(strippedFilter, index, collection)
  }

  saveToRouter(filter, router) {
    const formattedFilter = Object.assign({}, filter)
    if (filter.basic) {
      formattedFilter.basic = JSON.stringify(filter.basic)
    }
    if (filter.raw) {
      formattedFilter.raw = JSON.stringify(filter.raw)
    }
    if (filter.sorting) {
      formattedFilter.sorting = JSON.stringify(filter.sorting)
    }
    router.push({ query: formattedFilter })
  }

  saveToLocalStorage(filter, index, collection) {
    if (!index || !collection) {
      throw new Error(
        'Cannot save filters to localstorage if no index or collection are specfied'
      )
    }
    localStorage.setItem(
      `search-filter-current:${index}/${collection}`,
      JSON.stringify(filter)
    )
  }

  toSearchQuery(filter) {
    switch (filter.active) {
      case ACTIVE_QUICK:
        return this.quickFilterToSearchQuery(filter.quick)
      case ACTIVE_BASIC:
        return this.basicFilterToSearchQuery(filter.basic)
      case ACTIVE_RAW:
        return this.rawFilterToSearchQuery()
      case NO_ACTIVE:
      default:
        return this.emptyFilterToSearchQuery()
    }
  }

  quickFilterToSearchQuery(quickFilter) {
    if (!quickFilter) {
      return this.emptyFilterToSearchQuery()
    }

    return formatFromQuickSearch(quickFilter)
  }
  basicFilterToSearchQuery(basicFilter) {
    if (!basicFilter) {
      return this.emptyFilterToSearchQuery()
    }

    return formatFromBasicSearch(basicFilter)
  }
  rawFilterToSearchQuery() {}
  emptyFilterToSearchQuery() {
    return {}
  }
}

function isDefaultFilterValue(key, value) {
  return _.isEqual(defaultFilter[key], value)
}

function stripDefaultValuesFromFilter(filter) {
  let strippedFilter = {}
  Object.keys(filter).forEach(key => {
    if (isDefaultFilterValue(key, filter[key])) {
      return
    }
    strippedFilter[key] = filter[key]
  })
  return strippedFilter
}

export const NO_ACTIVE = null
export const ACTIVE_QUICK = 'quick'
export const ACTIVE_BASIC = 'basic'
export const ACTIVE_RAW = 'raw'
export const SORT_ASC = 'asc'
export const SORT_DESC = 'desc'
export const DEFAULT_QUICK = ''

export function Filter() {
  this.active = NO_ACTIVE
  this.quick = DEFAULT_QUICK
  this.basic = null
  this.raw = null
  this.sorting = null
  this.from = 0
}

const defaultFilter = new Filter()

export const filterManager = new FilterManager()

export const availableFilters = {
  // FIXME: rename to available operands
  match: 'Match',
  not_match: 'Not Match',
  equal: 'Equal',
  not_equal: 'Not equal'
}

export const formatFromQuickSearch = searchTerm => {
  if (searchTerm === '' || !searchTerm) {
    return {}
  }

  return {
    query: {
      bool: {
        should: [
          {
            match_phrase_prefix: {
              _all: {
                query: searchTerm
              }
            }
          },
          {
            match: {
              _id: searchTerm
            }
          }
        ]
      }
    }
  }
}

export const formatFromBasicSearch = (groups = [[]]) => {
  let bool = {}

  bool.should = groups.map(filters => {
    let formattedFilter = { bool: { must: [], must_not: [] } }
    filters.forEach(filter => {
      if (filter.attribute === null) {
        return
      }

      if (filter.operator === 'match') {
        formattedFilter.bool.must.push({
          match_phrase_prefix: { [filter.attribute]: filter.value }
        })
      } else if (filter.operator === 'not_match') {
        formattedFilter.bool.must_not.push({
          match_phrase_prefix: { [filter.attribute]: filter.value }
        })
      } else if (filter.operator === 'equal') {
        formattedFilter.bool.must.push({
          range: {
            [filter.attribute]: {
              gte: filter.value,
              lte: filter.value
            }
          }
        })
      } else if (filter.operator === 'not_equal') {
        formattedFilter.bool.must_not.push({
          range: {
            [filter.attribute]: {
              gte: filter.value,
              lte: filter.value
            }
          }
        })
      }
    })

    return formattedFilter
  })

  if (bool.should.length === 0) {
    return {}
  }

  return { query: { bool } }
}

export const formatPagination = (currentPage, limit) => {
  if (currentPage === undefined || limit === undefined) {
    return {}
  }

  return {
    from: limit * (currentPage - 1),
    size: limit
  }
}

export const formatSort = sorting => {
  if (!sorting.attribute) {
    return []
  }

  return [{ [sorting.attribute]: { order: sorting.order } }]
}
