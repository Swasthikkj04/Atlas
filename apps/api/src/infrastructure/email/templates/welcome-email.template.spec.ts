import {
  buildWelcomeEmailTemplate,
  extractFirstName,
  escapeHtml,
} from './welcome-email.template';

describe('Welcome Email Template', () => {
  const appUrl = 'https://nebula.argonion.com';

  describe('extractFirstName', () => {
    it('should extract first name from full name', () => {
      expect(extractFirstName('Swasthik K J')).toBe('Swasthik');
      expect(extractFirstName('Jane Doe')).toBe('Jane');
      expect(extractFirstName('Alice')).toBe('Alice');
    });

    it('should handle multiple leading and trailing whitespaces', () => {
      expect(extractFirstName('   Bob Builder  ')).toBe('Bob');
    });

    it('should fallback to "there" for null, undefined, or empty string', () => {
      expect(extractFirstName(null)).toBe('there');
      expect(extractFirstName(undefined)).toBe('there');
      expect(extractFirstName('')).toBe('there');
      expect(extractFirstName('   ')).toBe('there');
    });

    it('should fallback to "there" for non-string input', () => {
      expect(extractFirstName(123 as any)).toBe('there');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters to prevent injection', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
      expect(escapeHtml("John & 'Jane'")).toBe('John &amp; &#039;Jane&#039;');
    });
  });

  describe('buildWelcomeEmailTemplate', () => {
    it('should render correct subject, HTML, and plaintext with personalized first name', () => {
      const template = buildWelcomeEmailTemplate({
        recipientName: 'Swasthik K J',
        appUrl,
      });

      expect(template.subject).toBe('A little welcome to Nebula');
      expect(template.html).toContain('Hi Swasthik,');
      expect(template.html).toContain(
        'I’m Swasthik, the developer behind Nebula.',
      );
      expect(template.html).toContain(
        'Just wanted to personally welcome you. I hope Nebula brings a little more clarity to the way you understand your infrastructure.',
      );
      expect(template.html).toContain(
        'Your Workspace is ready whenever you are.',
      );
      expect(template.html).toContain('https://nebula.argonion.com');
      expect(template.html).toContain('Enter Nebula');
      expect(template.html).toContain('swasthik@argonion.com');
      expect(template.html).toContain('Developer, Nebula');

      // Plaintext checks
      expect(template.text).toContain('Hi Swasthik,');
      expect(template.text).toContain(
        'I’m Swasthik, the developer behind Nebula.',
      );
      expect(template.text).toContain('[Enter Nebula]');
      expect(template.text).toContain(appUrl);
      expect(template.text).toContain('Swasthik K J\nDeveloper, Nebula');
    });

    it('should render fallback greeting when name is absent', () => {
      const template = buildWelcomeEmailTemplate({
        recipientName: null,
        appUrl,
      });

      expect(template.subject).toBe('A little welcome to Nebula');
      expect(template.html).toContain('Hi there,');
      expect(template.text).toContain('Hi there,');
    });

    it('should escape malicious characters in recipient name', () => {
      const template = buildWelcomeEmailTemplate({
        recipientName: '<img src=x onerror=alert(1)> Hacker',
        appUrl,
      });

      expect(template.html).not.toContain('<img');
      expect(template.html).toContain('&lt;img');
    });
  });
});
