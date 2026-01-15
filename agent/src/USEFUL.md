List VMs

```bash
virsh -c qemu:///session list --all
```

Open Serial to a VM

```bash
virsh console <VM_NAME/UUID>
```

Kill Console Comamnd (In case of Stuck)

```bash
ps ax | grep -i "virsh.*console" | grep -v grep
kill -9 <PID>
```

Power ON/OFF/Kill

```bash
virsh start <VM_NAME/UUID>
virsh shutdown <VM_NAME/UUID>
virsh destroy <VM_NAME/UUID>    # Kill
```

Delete VM

```bash
virsh -c qemu:///session undefine <VM_NAME/UUID> --remove-all-storage --nvram
```

Info about Networking:

```bash
virsh domiflist <VM_NAME/UUID>
virsh dumpxml <VM_NAME/UUID> | grep -n "<interface" -n
virsh dumpxml <VM_NAME/UUID> | grep -n "<source" -n
```

Stats of all VMs

```bash
virsh domstats --list-running --raw --cpu-total --balloon --block --interface
```
