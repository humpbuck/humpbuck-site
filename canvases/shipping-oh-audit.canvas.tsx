import { Divider, H1, H2, Stack, Stat, Table, Text } from 'cursor/canvas';

export default function ShippingOhAuditCanvas() {
  return (
    <Stack gap={20}>
      <H1>OH 线路覆盖校对报告</H1>

      <Stack gap={12}>
        <Text>
          这份报告用于核对 `lib/shipping-oh.ts` 相对你提供的菜鸟国际 OH 线路表，哪些国家和区段已经覆盖，哪些地方还需要继续补全。
        </Text>
        <Text tone="secondary" size="small">
          目标是把每个国家、每个分区、每个重量段都落成可维护的数据结构，而不是只写成一组临时规则。
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>当前完成度</H2>
        <Stack gap={12} direction="horizontal">
          <Stat value="已覆盖大部分国家" label="国家规则" />
          <Stat value="AU / CA 已接入" label="分区国家" />
          <Stat value="仍需逐条校对" label="精度" tone="warning" />
        </Stack>
      </Stack>

      <Divider />

      <H2>已写入的内容</H2>
      <Table
        headers={["类别", "状态", "说明"]}
        rows={[
          ["美国 / 加拿大 / 墨西哥", "已写入", "包含对应重量段与基础附加费逻辑"],
          ["欧洲多国", "已写入", "包含主重量段与部分固定附加费"],
          ["澳大利亚", "已写入", "按 1/2/3/4 区区分报价"],
          ["新西兰 / 智利 / 沙特等", "已写入", "包含国家级附加费规则"],
        ]}
      />

      <Divider />

      <H2>需要继续补强的点</H2>
      <Table
        headers={["问题", "影响", "建议"]}
        rows={[
          ["部分国家仍是简化写法", "可能和原表不完全一致", "改成严格的结构化费率表"],
          ["澳大利亚/加拿大需要分区联动", "不同邮编区可能命中错误", "和 `global-postal-zones.ts` 精确联动"],
          ["部分附加费是函数式计算", "可读性略弱", "拆成显式 surcharge 配置"],
          ["个别重量段需要逐条复核", "存在边界误差风险", "按原始表逐段对照"],
        ]}
      />

      <Divider />

      <H2>下一步建议</H2>
      <Stack gap={8}>
        <Text>1. 把 OH 线路改成“国家 → 分区 → 重量段 → 附加费”的完整数据表。</Text>
        <Text>2. 对澳大利亚和加拿大做邮编分区命中校验。</Text>
        <Text>3. 逐国核对边界值，避免 0.1、0.2、0.5 这类临界值出错。</Text>
      </Stack>
    </Stack>
  );
}
