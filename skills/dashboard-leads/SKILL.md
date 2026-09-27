---
name: dashboard-leads
description: Consulta e atualiza o dashboard e o CRM de leads. Use quando o usuário disser dashboard, painel, meus leads ou controle de clientes.
---

# Dashboard de leads

- Use as ferramentas MCP do `search-customers-crm` como fonte única dos dados.
- Mantenha os status: novo, redesenhado, publicado, proposta, respondeu, fechado e descartado.
- Antes de mudar um status avançado, confirme a intenção do usuário.
- Registre follow-ups com `followup_record` e fechamentos por atualização parcial do lead.
- Nunca inclua segredos, senhas ou dados desnecessários nas observações.
- O dashboard local é iniciado com `npm run dev` em desenvolvimento ou `npm run build && npm start` em produção.
