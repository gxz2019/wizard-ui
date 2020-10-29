import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import sum from 'lodash/sum';
import isFunction from 'lodash/isFunction';
import isEqual from 'lodash/isEqual';
import {
  VirtualListState,
  VirtualAnchorItem,
  VirtualListDefaultProps,
  VirtualListProps,
  VirtualItem,
} from '../../interface';
import CSS from 'csstype';
import './style.scss';

const BASIC_STYLES: CSS.Properties = {
  position: 'absolute',
  width: '100%',
};
const RUNWAY_ITEMS = 50;
const RUNWAY_ITEMS_OPPSITE = 20;

function getHeight(el: HTMLDivElement) {
  const styles = window.getComputedStyle(el);
  const height = el.offsetHeight;
  const marginTop = parseFloat(styles.marginTop || '0');
  const marginBottom = parseFloat(styles.marginBottom || '0');
  return height + marginTop + marginBottom;
}

const defaultProps: VirtualListDefaultProps<VirtualItem> = {
  height: '100%',
  data: [],
  runwayItems: RUNWAY_ITEMS,
  runwayItemsOppsite: RUNWAY_ITEMS_OPPSITE,
  loader: <p className="VirtualList__loader">数据加载中</p>,
  placeholder: <p className="VirtualList__placeholder">暂无数据</p>,
  noMoreHint: <p className="VirtualList__no-more-hint">没有更多信息</p>,
  debug: true,
};

export default class VirtualList<T> extends React.Component<VirtualListProps<T>, VirtualListState> {
  static propTypes = {
    /** 行高 */
    rowHeight: PropTypes.oneOfType([PropTypes.func, PropTypes.number]).isRequired,
    /** 渲染 row UI */
    rowRenderer: PropTypes.func.isRequired,
    /** 可见高度 */
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** 数据 */
    data: PropTypes.array,
    /** 是否开启计算 */
    isEstimate: PropTypes.bool,
    /** 监听 query 改变 */
    onQueryChange: PropTypes.func,
    /** 确定异步数据的 offset 和 limit */
    query: PropTypes.object,
    /** 总数 */
    totalCount: PropTypes.number,
    /** 是否在获取数据 */
    isFetching: PropTypes.bool,
    /** 行高 */
    runwayItems: PropTypes.number,
    /** 行高 */
    runwayItemsOppsite: PropTypes.number,
    /** 数据加载中时展示 */
    loader: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** 默认展示文本 */
    placeholder: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** 是否展示没有多余的数据 */
    noMore: PropTypes.bool,
    /** 没有需要加载的数据时展示 */
    noMoreHint: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** Debug */
    debug: PropTypes.bool,
  };
  static defaultProps = defaultProps;
  holder: React.RefObject<HTMLDivElement>;
  list: React.RefObject<HTMLDivElement>;
  heightCache: number[];
  totalHeight: number;
  anchorItem: VirtualAnchorItem;
  anchorScrollTop: number;
  constructor(props: VirtualListProps<T>) {
    super(props);
    this.holder = React.createRef();
    this.list = React.createRef();
    this.heightCache = [];
    this.totalHeight = 0;
    this.anchorItem = {
      index: 0,
      offset: 0,
    };
    this.anchorScrollTop = 0;
    this.state = {
      startIndex: 0,
      endIndex: 0,
    };
  }

  get wrapperHeight() {
    const { height } = this.props;
    if (typeof height === 'number') {
      return height;
    }
    if (this.holder.current && this.holder.current.offsetHeight) {
      return this.holder.current.offsetHeight;
    }
    return 450;
  }
  get noMore() {
    const { noMore, totalCount, data } = this.props;
    if (noMore) {
      return true;
    }
    if (totalCount === data.length) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    const { data } = this.props;
    this.handleResize(data);
    window.addEventListener('resize', () => {
      console.log(11111111111111);
      this.resizeHandler()
    });
  }
  componentDidUpdate(prevProps: VirtualListProps<T>) {
    const { isEstimate, debug, data, isReloading } = this.props;
    const { startIndex } = this.state;

    if (!isEqual(prevProps.data, data)) {
      this.handleResize(data, false);
    }
    if (!prevProps.isReloading && isReloading) {
      this.reset();
      if (this.list.current) {
        this.list.current.scrollTop = 0;
      }
      this.setState({
        startIndex: 0,
        endIndex: 0,
      });
    }

    let needRender = false;
    if (isEstimate && this.list.current && this.list.current.querySelectorAll) {
      const rows: NodeListOf<HTMLDivElement> = this.list.current.querySelectorAll(
        '.VirtualList > *',
      );
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const realHeight = getHeight(row);
        const index = startIndex + i;
        if (realHeight !== this.heightCache[index]) {
          if (debug && process && process.env.NODE_ENV === 'development') {
            console.warn(
              `Index ${index} estimate height is ${this.heightCache[index]}, real height is ${realHeight}.`,
            );
          }
          this.heightCache[index] = realHeight;
          needRender = true;
        }
      }
      if (needRender) {
        this.totalHeight = sum(this.heightCache);
        this.forceUpdate();
      }
    }
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  reset() {
    this.heightCache = [];
    this.anchorItem = {
      index: 0,
      offset: 0,
    };
    this.anchorScrollTop = 0;
  }

  // resizeHandler is a wrapper of this.handleResize
  // only used for addEventListener and removeEventListener
  resizeHandler = () => {
    this.handleResize(this.props.data);
  };
  handleResize = (data: T[], flushCache?: boolean) => {
    this.recomputeRowHeight(data, flushCache);
    this.handleScroll();
  };
  correctAnchor = () => {
    const { index, offset } = this.anchorItem;
    this.anchorScrollTop = sum(this.heightCache.slice(0, index)) + offset;
  };
  recomputeRowHeight = (nextData: T[], flushCache: boolean = true) => {
    if (flushCache) {
      this.heightCache = [];
    }
    const { rowHeight } = this.props;
    const data = nextData || this.props.data;
    const count = data.length;

    for (let i = this.heightCache.length; i < count; i++) {
      const item = data[i];
      const prevItem = i > 0 ? data[i - 1] : null;
      const nextItem = i < data.length - 1 ? data[i + 1] : null;
      const height = isFunction(rowHeight)
        ? rowHeight({
            index: i,
            item,
            prevItem,
            nextItem,
          })
        : rowHeight;
      if (height) {
        this.heightCache.push(height);
      }
    }
    this.totalHeight = sum(this.heightCache);
    this.forceUpdate();
  };

  handleScroll = () => {
    const { runwayItems = RUNWAY_ITEMS, runwayItemsOppsite = RUNWAY_ITEMS_OPPSITE } = this.props;
    const { scrollTop = 0, offsetHeight = 0 } = this.list.current || {};
    const delta = scrollTop - this.anchorScrollTop;

    this.anchorItem = scrollTop === 0 ? { index: 0, offset: 0 } : this.calculateAnchoredItem(delta);
    this.anchorScrollTop = scrollTop;

    const lastVisibleItem = this.calculateAnchoredItem(offsetHeight);
    let startIndex;
    let endIndex;
    if (delta < 0) {
      startIndex = Math.max(0, this.anchorItem.index - runwayItems);
      endIndex = Math.min(lastVisibleItem.index + runwayItemsOppsite, this.heightCache.length);
    } else {
      startIndex = Math.max(0, this.anchorItem.index - runwayItemsOppsite);
      endIndex = Math.min(lastVisibleItem.index + runwayItems, this.heightCache.length);
    }
    this.setState(
      {
        startIndex,
        endIndex,
      },
      this.tryToFetchData,
    );
  };

  calculateAnchoredItem = (delta: number) => {
    const { data } = this.props;

    if (delta === 0) return this.anchorItem;
    let { index, offset: initialOffset } = this.anchorItem;
    delta += initialOffset;

    if (delta < 0) {
      while (delta < 0 && index > 0 && this.heightCache[index] !== undefined) {
        delta += this.heightCache[index - 1];
        index--;
      }
    } else {
      while (
        delta > 0 &&
        index < data.length &&
        this.heightCache[index] !== undefined &&
        this.heightCache[index] < delta
      ) {
        delta -= this.heightCache[index];
        index++;
      }
    }

    return {
      index,
      offset: delta,
    };
  };

  attachItems = () => {
    this.correctAnchor();
    const { data } = this.props;
    const { startIndex, endIndex } = this.state;
    if (this.heightCache.length === 0) return [];

    let items = [];
    let { index, offset } = this.anchorItem;
    let currentPosition = this.anchorScrollTop - offset;
    while (index > startIndex) {
      currentPosition -= this.heightCache[index - 1];
      index--;
    }
    while (index < startIndex) {
      currentPosition += this.heightCache[index];
      index++;
    }

    for (let i = startIndex; i < endIndex; i++) {
      const item = data[i];
      const prevItem = i > 0 ? data[i - 1] : null;
      const nextItem = i < data.length - 1 ? data[i + 1] : null;
      items.push({
        index: i,
        item,
        prevItem,
        nextItem,
        style: {
          ...BASIC_STYLES,
          transform: `translateY(${currentPosition}px)`,
        },
      });
      currentPosition += this.heightCache[i];
    }
    return items;
  };

  tryToFetchData = () => {
    const { data, query, onQueryChange, isFetching } = this.props;
    const { endIndex } = this.state;
    if (isFetching) return;
    if (endIndex < data.length) return;
    if (this.noMore) return;
    if (onQueryChange && query) {
      const { offset = 0, limit = 0 } = query;
      onQueryChange({
        ...query,
        offset: offset + limit,
        limit,
      });
    }
  };

  render() {
    const {
      rowRenderer,
      data,
      isFetching,
      isReloading,
      height,
      loader,
      placeholder,
      noMoreHint,
      className,
    } = this.props;
    const noData = data.length === 0;
    return (
      <div className="VirtualList__holder" ref={this.holder} style={{ height }}>
        <div
          className="VirtualList__wrapper"
          style={{ height: this.wrapperHeight }}
          onScroll={this.handleScroll}
          ref={this.list}
        >
          {!isFetching && noData && placeholder}
          {!isReloading && !noData && (
            <div
              className={classnames('VirtualList', className)}
              style={{
                width: '100%',
                height: this.totalHeight,
              }}
            >
              {this.attachItems().map(rowRenderer)}
            </div>
          )}
          {isFetching && loader}
          {!isFetching && !noData && this.noMore && noMoreHint}
        </div>
      </div>
    );
  }
}
