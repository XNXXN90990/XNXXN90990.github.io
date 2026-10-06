# 大语言模型

LLM 是当前 AI 系统研究的主要工作负载,训练和推理的算力规律直接决定加速器设计,因此从深度生成模型目录独立成组。

```mermaid
graph LR
    classDef beginner fill:#EFF6FF,stroke:#3B82F6,color:#1E40AF
    classDef intermediate fill:#F0FDF4,stroke:#16A34A,color:#15803D
    classDef advanced fill:#F8FAFC,stroke:#64748B,color:#334155
    FDU["复旦 自然语言处理与大模型"]:::beginner
    OpenBMB["清华/OpenBMB 大模型公开课"]:::intermediate
    CMU["CMU 11-711 Advanced NLP"]:::intermediate
    Limu["李沐 论文精读"]:::intermediate
    CS336["Stanford CS336 从零实现 LLM"]:::advanced
    FDU --> OpenBMB
    FDU --> CMU
    OpenBMB --> Limu
    OpenBMB --> CS336
    CMU --> Limu
    CMU --> CS336
```

## 相关科研方向

- [AI 算法与系统](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/AI%E7%AE%97%E6%B3%95%E4%B8%8E%E7%B3%BB%E7%BB%9F)
- [处理器架构与编译系统](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/%E5%A4%84%E7%90%86%E5%99%A8%E6%9E%B6%E6%9E%84%E4%B8%8E%E7%BC%96%E8%AF%91%E7%B3%BB%E7%BB%9F)
- [存算一体与近存计算](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/%E5%AD%98%E7%AE%97%E4%B8%80%E4%BD%93%E4%B8%8E%E8%BF%91%E5%AD%98%E8%AE%A1%E7%AE%97)

