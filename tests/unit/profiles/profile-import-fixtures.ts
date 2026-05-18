import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import type { RenderableNode } from "@smagicalsub/subscription";

export function profile(id: string, name: string): ProfileDto {
  return {
    created_at: "2026-05-13T00:00:00Z",
    default_strategy: "Proxy",
    description: null,
    enabled: 1,
    id,
    name,
    owner_id: null,
    updated_at: "2026-05-13T00:00:00Z"
  };
}

export function rule(id: string, profileId: string, value: string): ProfileRuleDto {
  return {
    content: {},
    enabled: 1,
    format: "common",
    id,
    position: 0,
    profile_id: profileId,
    rule: value
  };
}

export function sampleNode(): RenderableNode {
  return {
    config_json: JSON.stringify({
      cipher: "aes-256-gcm",
      password: "pass",
      port: 8388,
      server: "example.com",
      type: "ss"
    }),
    groups: ["sample"],
    id: "node-sample",
    name: "HK",
    protocol: "ss"
  };
}

export function clashClientSample() {
  return [
    "mixed-port: 7890",
    "allow-lan: true",
    "mode: rule",
    "dns:",
    "  enable: true",
    "  enhanced-mode: fake-ip",
    "  fake-ip-filter:",
    "    - '*.lan'",
    "  default-nameserver:",
    "    - 223.5.5.5",
    "  nameserver:",
    "    - https://dns.alidns.com/dns-query",
    "  fallback:",
    "    - https://cloudflare-dns.com/dns-query",
    "  proxy-server-nameserver:",
    "    - https://doh.pub/dns-query",
    "  proxy-server-nameserver-policy:",
    "    www.yournode.com: 114.114.114.114",
    "  direct-nameserver:",
    "    - system",
    "  direct-nameserver-follow-policy: false",
    "  fallback-filter:",
    "    geoip: true",
    "    geoip-code: CN",
    "    geosite:",
    "      - gfw",
    "    ipcidr:",
    "      - 240.0.0.0/4",
    "    domain:",
    "      - '+.google.com'",
    "  nameserver-policy:",
    "    geosite:cn: https://dns.alidns.com/dns-query",
    "tun:",
    "  enable: true",
    "  stack: mixed",
    "  dns-hijack:",
    "    - any:53",
    "proxy-groups:",
    "  - name: Proxy",
    "    type: select",
    "    proxies:",
    "      - Auto",
    "      - DIRECT",
    "  - name: Auto",
    "    type: url-test",
    "    proxies:",
    "      - HK",
    "    url: http://www.gstatic.com/generate_204",
    "    interval: 300",
    "    lazy: true",
    "    timeout: 5000",
    "    expected-status: 204",
    "    use:",
    "      - airport",
    "rule-providers:",
    "  geosite-cn:",
    "    type: http",
    "    behavior: domain",
    "    format: yaml",
    "    url: https://example.com/geosite-cn.yaml",
    "proxy-providers:",
    "  airport:",
    "    type: http",
    "    url: https://example.com/sub.yaml",
    "    path: ./providers/airport.yaml",
    "    health-check:",
    "      enable: true",
    "      url: http://www.gstatic.com/generate_204",
    "      interval: 300",
    "      lazy: true",
    "      expected-status: 204",
    "    override:",
    "      udp: true",
    "      skip-cert-verify: true",
    "      additional-prefix: 'airport | '",
    "rules:",
    "  - DOMAIN-SUFFIX,example.com,DIRECT",
    "  - RULE-SET,geosite-cn,Proxy",
    "  - MATCH,Proxy"
  ].join("\n");
}

export function singBoxClientSample() {
  return {
    dns: {
      final: "remote",
      independent_cache: true,
      reverse_mapping: true,
      rules: [
        {
          action: "route",
          domain_suffix: [".lan"],
          server: "local"
        }
      ],
      servers: [
        { tag: "fakeip", type: "fakeip" },
        { server: "dns.example", server_port: 443, tag: "remote", type: "https" }
      ],
      strategy: "prefer_ipv4"
    },
    experimental: {
      clash_api: {
        external_controller: "127.0.0.1:9090"
      }
    },
    inbounds: [
      {
        address: ["172.19.0.1/30"],
        auto_route: true,
        listen_port: 2081,
        sniff: true,
        tag: "tun-in",
        type: "tun"
      },
      {
        listen: "127.0.0.1",
        listen_port: 2080,
        sniff: true,
        tag: "mixed-in",
        type: "mixed"
      }
    ],
    outbounds: [
      {
        outbounds: ["HK", "direct"],
        tag: "Proxy",
        type: "selector"
      },
      {
        tag: "direct",
        type: "direct"
      }
    ],
    route: {
      auto_detect_interface: true,
      default_domain_resolver: {
        server: "remote",
        strategy: "prefer_ipv4"
      },
      default_network_strategy: "prefer_ipv4",
      final: "Proxy",
      rule_set: [
        {
          download_detour: "direct",
          format: "binary",
          http_client: "direct",
          tag: "geosite-cn",
          type: "remote",
          url: "https://example.com/geosite-cn.srs"
        }
      ],
      rules: [
        {
          action: "route",
          geosite: ["cn"],
          outbound: "direct"
        },
        {
          mode: "or",
          rules: [
            { domain_suffix: ["ads.example"] },
            { rule_set: ["geosite-cn"] }
          ],
          type: "logical",
          action: "reject"
        }
      ]
    }
  };
}

export function xrayClientSample() {
  return {
    api: {
      services: ["StatsService"],
      tag: "api"
    },
    dns: {
      queryStrategy: "UseIPv4",
      servers: [
        {
          address: "https://dns.example/dns-query",
          domains: ["geosite:cn"],
          skipFallback: true
        },
        "localhost"
      ]
    },
    inbounds: [
      {
        listen: "127.0.0.1",
        port: 10808,
        protocol: "socks",
        settings: {
          udp: true
        },
        sniffing: {
          destOverride: ["http", "tls", "quic"],
          enabled: true
        },
        tag: "socks-in"
      }
    ],
    observatory: {
      probeURL: "https://www.google.com/generate_204",
      subjectSelector: ["node:"]
    },
    policy: {
      levels: {
        "0": {
          statsUserUplink: true
        }
      }
    },
    routing: {
      balancers: [
        {
          selector: ["node:"],
          tag: "Proxy"
        }
      ],
      domainStrategy: "IPIfNonMatch",
      domainMatcher: "mph",
      rules: [
        {
          domain: ["geosite:cn"],
          outboundTag: "direct",
          type: "field"
        },
        {
          balancerTag: "Proxy",
          domain: ["domain:example.com"],
          ruleTag: "example-proxy",
          type: "field"
        }
      ]
    },
    stats: {}
  };
}
