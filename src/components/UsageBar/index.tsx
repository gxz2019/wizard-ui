import * as React from 'react';
import * as PropTypes from 'prop-types';
import { ProgressBar, Row, Col } from 'react-bootstrap';
import { bulk, xbytes } from '../../utils';
import { UsageBarProps } from '../../interface';
import lang from "../../locale/language";
import lodash from 'lodash';
import './style.scss';

const PERCENT_WITH_STATUS = {
  warning: 0.75,
  danger: 0.85,
};

function calcPercent(p: number) {
  let percent: number | string = 100 * p;
  if (percent < 0.01 && percent > 0) {
    percent = '0.01%';
  } else if (percent < 1) {
    percent = `${percent.toFixed(3)}%`;
  } else if (isNaN(percent)) {
    percent = 'NO';
  } else {
    percent = `${percent.toFixed(2)}%`;
  }
  return percent;
}

const UsageBar: React.FC<UsageBarProps> = props => {
  const {
    max,
    isByte,
    isPercent,
    isBulk,
    withPercent,
    inline,
    hideNow,
    hideRight,
    showZeroMax,
    withUnavailable,
    isExcludeWarning,
    waterLine,
    isHideFooter,
    formatType,
    series,
    withLenged,
    unavailableData,
  } = props;
  const hasNow = props.hasOwnProperty('now');
  const hasPercent = props.hasOwnProperty('percent');
  const hasSeries = props.hasOwnProperty('series');
  let left;
  let right;
  let usedStyle;
  let finalSeries: Array<any>;
  switch (true) {
    case hasSeries:
      const total = lodash.sumBy(series, 'value');
      finalSeries = lodash.map(series, ({ name, value, bsStyle }) => {
        const perc = value / total;
        let legend: any = perc;
        switch (true) {
          case isPercent:
            legend = calcPercent(perc);
            break;
          case isByte:
            legend = xbytes(value, {});
            break;
          case isBulk:
            legend = bulk(value, {});
            break;
          default: ;
        }
        return {
          name,
          bsStyle,
          perc,
          legend,
          value,
        }
      })
      break;
    default:
      const now = hasNow ? props.now : props.percent && max && props.percent * max;
      const percent = hasPercent ? props.percent : max ? props.now && props.now / max : 0;
      const errorPercent = unavailableData && max && unavailableData / max;
      let nowValue: number | string | undefined = now;
      let maxValue: number | string | undefined = max;
      let nowSuffix: any = '';
      let maxSuffix: any = '';
      // bar 左边为百分比形式， 右边默认设为百分形式
      if (isPercent || hasPercent) {
        nowValue = percent && (percent * 100).toFixed(2);
        maxValue = 100;
        nowSuffix = maxSuffix = '%';
      }

      if (isByte || formatType) {
        // hasPercent 表明左边数据设置完成（百分比形式），不需要再调整
        let byteOptions: object = { splitUnit: true };
        if (formatType) {
          byteOptions = { splitUnit: true, formatType };
        }

        if (!hasPercent && now) {
          const nowArr: any = xbytes(now, byteOptions);
          nowValue = nowArr[0];
          nowSuffix = nowArr[1];
        }
        const maxArr: any = max && xbytes(max, byteOptions);
        maxValue = maxArr[0] === undefined ? 0 : maxArr[0];
        maxSuffix = maxArr[1] === undefined ? 'B' : maxArr[1];
      } else if (isBulk) {
        // hasPercent 表明左边数据设置完成（百分比形式），不需要再调整
        if (!hasPercent && now) {
          const nowArr = bulk(now, { splitUnit: true });
          nowValue = nowArr[0];
          nowSuffix = nowArr[1];
        }
        const maxArr: any = max && bulk(max, { splitUnit: true });
        maxValue = maxArr[0] === undefined ? 0 : maxArr[0];
        maxSuffix = maxArr[1] === undefined ? '' : maxArr[1];
      }

      // max 为 0 时，设置为无限制
      // isPercent，hasPercent 涉及到百分比展示，此时 max 不应该为无限制
      // showZeroMax 直接展示 max 为处理后的 0 + 单位
      if (!max && !hasPercent && !isPercent && !showZeroMax) {
        maxValue = lang().MAX_VALUE;
        maxSuffix = '';
      }

      // 处理 bar 颜色
      if (percent && percent > PERCENT_WITH_STATUS.danger) {
        usedStyle = 'danger';
      } else if (
        percent &&
        percent < PERCENT_WITH_STATUS.danger &&
        percent > PERCENT_WITH_STATUS.warning && !isExcludeWarning
      ) {
        usedStyle = 'warning';
      }

      if (withPercent) {
        // 左边百分比形式，右边展示数值
        left = percent && calcPercent(percent);
        // 右边只展示 max 数值
        if (hideNow) {
          right = maxValue + maxSuffix;
        } else {
          right = `${nowValue + nowSuffix}/${maxValue + maxSuffix}`;
        }
      } else {
        left = nowValue + nowSuffix;
        right = maxValue + maxSuffix;
      }
      //纯数字的进度条屏蔽右侧显示
      if (hideRight) {
        right = '';
      }
      finalSeries = lodash.compact([
        {
          bsStyle: usedStyle,
          perc: percent,
          value: now,
        },
        withUnavailable && {
          bsStyle: 'info',
          perc: errorPercent,
          value: unavailableData,
        }
      ]);
  }

  return (
    <div className={`UsageBar ${inline ? 'inline' : ''}`}>
      <ProgressBar>
        {lodash.map(finalSeries, ({ bsStyle, perc }, index) => (
          // bs ProgressBar 只支持最多 5 种 style，索引摒弃 bsStyle 属性，改用组装 className
          <ProgressBar className={bsStyle && `progress-bar-${bsStyle}`} now={perc} max={1} key={index} />
        ))}
      </ProgressBar>
      {waterLine && (
        <div className="UsageBar__water-line" style={{ marginLeft: 100 * waterLine + '%' }} />
      )}
      {!isHideFooter && !hasSeries && (
        <div className="UsageBar__footer">
          <div className="UsageBar__footer--left">{left}</div>
          <div className="UsageBar__footer--right">{right}</div>
        </div>
      )}
      { hasSeries && withLenged && (
        <Row className="UsageBar__legend">
          {lodash.map(finalSeries, ({ name, legend, bsStyle, value }, index) => (
            <Col xs={12} className={`Legend ${bsStyle} ${value ? '' : 'noVal'}`} key={index}>
              <span title={typeof name === 'string' ? name : undefined}>{name}</span>
              <span title={legend}>{legend}</span>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

UsageBar.propTypes = {
  /**
   * 当前量
   **/
  now: PropTypes.number,
  /**
   * 最大量
   **/
  max: PropTypes.number,
  /**
   * 百分比
   **/
  percent: PropTypes.number,
  /**
   * 数字以百分比为单位展示
   **/
  isPercent: PropTypes.bool,
  /**
   * 数字以字节（B, KB, MB, GB...）为单位展示
   **/
  isByte: PropTypes.bool,
  /**
   * 格式化输出，可选[decimal|binary]
   **/
  formatType: PropTypes.string,
  /**
   * 数字以数量（万, 亿, 兆, 京...）为单位展示
   **/
  isBulk: PropTypes.bool,
  /**
   * 设置组件行内展示，width 为 120px
   **/
  inline: PropTypes.bool,
  /**
   * 当 max 为 0 时，展示为 0+单位 或者无限制
   **/
  showZeroMax: PropTypes.bool,
  /**
   * 是否隐藏 now 的展示
   **/
  hideNow: PropTypes.bool,
  /**
   * 是否隐藏 right 的展示
   **/
  hideRight: PropTypes.bool,
  /**
   * 左边数值百分比展示
   **/
  withPercent: PropTypes.bool,
  /**
   * 2段以上数据的processbar
   * https://react-bootstrap.netlify.com/components/progress/#progress-bar-props
   * <ProgressBar>
   * <ProgressBar striped variant="success" now={35} key={1} />
   * <ProgressBar variant="warning" now={20} key={2} />
   * </ProgressBar>;
   */
  withUnavailable: PropTypes.bool,
  /**
   * 不可用数据量
   **/
  unavailableData: PropTypes.number,
  /**
   * 是否排除告警（黄色）状态，排除后按常态展示
   **/
  isExcludeWarning: PropTypes.bool,
  /**
   * 水位线
   **/
  waterLine: PropTypes.number,
  /**
   * 是否隐藏 footer 的展示
   **/
  isHideFooter: PropTypes.bool,
  /**
   * 2段以上 processbar 的数据集，该模式下支持（isPercent，isByte，isBulk，inline，withLenged）等属性
   * [{ name: 'pool1', value: 20, bsStyle: 'primary' }, { name: 'pool2', value: 40, bsStyle: 'success' }, { name: 'pool3', value: 20, bsStyle: 'error' }]
   **/
  series: PropTypes.array,
  /**
   * series 模式下是否显示图例
   **/
  withLenged: PropTypes.bool,
};
UsageBar.defaultProps = {
  max: 0,
};

export default UsageBar;
