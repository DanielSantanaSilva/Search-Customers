---
name: deploy-hostinger
description: Publica sites aprovados na hospedagem Hostinger. Use quando o usuário disser publicar, subir site, colocar no ar, deploy, Hostinger ou hPanel.
---

# Publicação segura na Hostinger

1. Confirme o lead, os arquivos, o domínio e o diretório de destino antes do upload.
2. Consulte o hPanel para confirmar se o plano oferece hospedagem estática, Node.js, SSH ou SFTP; não presuma que todos os planos possuem os mesmos recursos.
3. Para sites estáticos, gere o build e publique somente o conteúdo de `dist` no diretório raiz configurado para o domínio.
4. Para aplicações Node.js, confirme compatibilidade com Node.js 22, `better-sqlite3`, processo persistente e armazenamento gravável antes de publicar.
5. Prefira SFTP, SSH ou o gerenciador de arquivos do hPanel; não use FTP sem criptografia.
6. Obtenha credenciais por variável de ambiente ou cofre do sistema, nunca pelo repositório, banco ou observações do CRM.
7. Faça backup antes de substituir arquivos existentes e não envie `.env`, bancos SQLite, `node_modules` ou arquivos internos do plugin em deploy estático.
8. Verifique DNS, HTTPS, status HTTP, assets, rotas, responsividade e links após publicar.
9. Quando houver API, verifique `/api/health`, leitura e escrita no banco e persistência após reinicialização.
10. Registre a URL no CRM e altere o status para `publicado` somente após a verificação.
