"""HTTP-only link checks. No response bodies or application records are read."""
from urllib.request import Request, urlopen
from urllib.parse import urlsplit, urlunsplit, quote
from urllib.error import HTTPError, URLError
import socket

def transport_url(url):
    p=urlsplit(url)
    if p.scheme not in ('http','https') or not p.hostname or p.username or p.password:
        raise ValueError('Invalid public HTTP URL')
    host=p.hostname.encode('idna').decode('ascii')
    if ':' in host:host='['+host+']'
    if p.port:host+=':'+str(p.port)
    return urlunsplit((p.scheme,host,quote(p.path,safe='/%:@!$&\'()*+,;=-._~'),quote(p.query,safe='=&%/:?@!$\'()*+,;~-._'),''))

def check_external(url,timeout=12):
    try: target=transport_url(url)
    except (ValueError,UnicodeError) as e:return None,str(e)
    headers={'User-Agent':'Mozilla/5.0 (compatible; PDRKampus-LinkAudit/1.0)'}
    for method in ('HEAD','GET'):
        try:
            with urlopen(Request(target,headers=headers,method=method),timeout=timeout) as r:
                return r.status,r.geturl()
        except HTTPError as e:
            if e.code in (404,410,405,501) and method=='HEAD':continue
            return e.code,target
        except (URLError,socket.timeout,TimeoutError,OSError,ValueError,UnicodeError) as e:
            if method=='HEAD':continue
            return None,str(e)
    return None,'unknown transport failure'
